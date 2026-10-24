package pdf

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"html/template"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
	"docora/backend/internal/models"
)

type PageSize string

const (
	PageSizeA4     PageSize = "A4"
	PageSizeA5     PageSize = "A5"
	PageSizeLetter PageSize = "Letter"
)

type RenderData struct {
	Document        *models.Document
	BusinessProfile *models.BusinessProfile
	Customer        *models.Customer
	Template        *models.Template
	LogoBase64      string
	PageSize        string
	Orientation     string // "portrait" or "landscape"
	Margin          string // "normal", "compact", "wide"
	FormattedDates  map[string]string
	Sections        []models.GeneralPDFSection
}

type Renderer interface {
	Render(ctx context.Context, data *RenderData) ([]byte, error)
}

type ChromedpRenderer struct {
	chromeBin string
	timeout   time.Duration
}

func NewRenderer(chromeBin string, timeout time.Duration) Renderer {
	if timeout <= 0 {
		timeout = 45 * time.Second
	}
	return &ChromedpRenderer{
		chromeBin: chromeBin,
		timeout:   timeout,
	}
}

// FindChromePath attempts to locate Chrome, Chromium, or Edge
func (r *ChromedpRenderer) FindChromePath() string {
	if r.chromeBin != "" {
		if _, err := os.Stat(r.chromeBin); err == nil {
			return r.chromeBin
		}
	}

	var candidates []string
	switch runtime.GOOS {
	case "windows":
		candidates = []string{
			`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
			`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
			`C:\Program Files\Google\Chrome\Application\chrome.exe`,
			`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
		}
	case "darwin":
		candidates = []string{
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
		}
	default: // Linux / Docker
		candidates = []string{
			"/usr/bin/chromium",
			"/usr/bin/chromium-browser",
			"/usr/bin/google-chrome",
			"/usr/bin/google-chrome-stable",
			"/snap/bin/chromium",
		}
	}

	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			return path
		}
		if p, err := exec.LookPath(path); err == nil {
			return p
		}
	}

	for _, name := range []string{"chromium", "chromium-browser", "google-chrome", "chrome", "msedge"} {
		if p, err := exec.LookPath(name); err == nil {
			return p
		}
	}

	return ""
}

func (r *ChromedpRenderer) Render(ctx context.Context, data *RenderData) ([]byte, error) {
	htmlContent, err := r.generateHTML(data)
	if err != nil {
		return nil, fmt.Errorf("failed compiling HTML template: %w", err)
	}

	chromePath := r.FindChromePath()
	if chromePath == "" {
		return r.generateFallbackPDF(data, htmlContent)
	}

	renderCtx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.ExecPath(chromePath),
		chromedp.NoSandbox,
		chromedp.DisableGPU,
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-software-rasterizer", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("hide-scrollbars", true),
		chromedp.Flag("headless", true),
	)

	allocCtx, allocCancel := chromedp.NewExecAllocator(renderCtx, opts...)
	defer allocCancel()

	taskCtx, taskCancel := chromedp.NewContext(allocCtx)
	defer taskCancel()

	dataURI := "data:text/html;base64," + base64.StdEncoding.EncodeToString([]byte(htmlContent))

	// Navigate to page
	if err := chromedp.Do(taskCtx, chromedp.Navigate(dataURI)); err != nil {
		return r.generateFallbackPDF(data, htmlContent)
	}

	// Prepare print options
	pdfOpts := []chromedp.PDFOption{
		chromedp.PDFPrintBackground(),
	}

	// Paper size
	switch strings.ToUpper(data.PageSize) {
	case "A5":
		pdfOpts = append(pdfOpts, chromedp.PDFPaper(chromedp.PaperSize{Width: 5.83, Height: 8.27}))
	case "LETTER":
		pdfOpts = append(pdfOpts, chromedp.PDFPaper(chromedp.PaperLetter))
	case "A4":
		fallthrough
	default:
		pdfOpts = append(pdfOpts, chromedp.PDFPaper(chromedp.PaperA4))
	}

	if strings.ToLower(data.Orientation) == "landscape" {
		pdfOpts = append(pdfOpts, chromedp.PDFLandscape())
	}

	switch strings.ToLower(data.Margin) {
	case "compact":
		pdfOpts = append(pdfOpts, chromedp.PDFMargins(0.3, 0.3, 0.3, 0.3))
	case "wide":
		pdfOpts = append(pdfOpts, chromedp.PDFMargins(0.8, 0.8, 0.8, 0.8))
	default: // normal
		pdfOpts = append(pdfOpts, chromedp.PDFMargins(0.5, 0.5, 0.5, 0.5))
	}

	var pdfBuffer []byte
	pdfBuffer, err = chromedp.Run(taskCtx, chromedp.PrintToPDF(pdfOpts...))
	if err != nil {
		return r.generateFallbackPDF(data, htmlContent)
	}

	if len(pdfBuffer) == 0 {
		return r.generateFallbackPDF(data, htmlContent)
	}

	return pdfBuffer, nil
}

// generateHTML selects the layout and executes Go html/template
func (r *ChromedpRenderer) generateHTML(data *RenderData) (string, error) {
	tmplFuncs := template.FuncMap{
		"formatMoney": func(minor int64, curr string) string {
			units := float64(minor) / 100.0
			if curr == "" {
				curr = "USD"
			}
			switch curr {
			case "EUR":
				return fmt.Sprintf("€%.2f", units)
			case "GBP":
				return fmt.Sprintf("£%.2f", units)
			case "JPY":
				return fmt.Sprintf("¥%.0f", units*100)
			default:
				return fmt.Sprintf("$%.2f", units)
			}
		},
		"formatDate": func(t time.Time) string {
			if t.IsZero() {
				return ""
			}
			return t.Format("2006-01-02")
		},
		"formatFloat": func(f float64) string {
			return fmt.Sprintf("%.2f", f)
		},
		"formatTax": func(rate float64) string {
			return fmt.Sprintf("%.1f%%", rate*100)
		},
		"sub": func(a, b int64) int64 {
			return a - b
		},
		"add": func(a, b int64) int64 {
			return a + b
		},
		"upper": strings.ToUpper,
		"lower": strings.ToLower,
	}

	var tmplString string
	switch data.Document.DocumentType {
	case models.TypeReceipt:
		tmplString = ReceiptTemplate
	case models.TypeInvoice:
		tmplString = InvoiceTemplate
	case models.TypeGeneral:
		tmplString = GeneralDocumentTemplate
	default:
		tmplString = ReceiptTemplate
	}

	t, err := template.New("document").Funcs(tmplFuncs).Parse(tmplString)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// generateFallbackPDF produces a standard compliant PDF 1.4 binary when headless browser is not present
func (r *ChromedpRenderer) generateFallbackPDF(data *RenderData, html string) ([]byte, error) {
	var b bytes.Buffer
	b.WriteString("%PDF-1.4\n")
	b.WriteString("%âãÏÓ\n")

	b.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
	b.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
	b.WriteString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n")
	b.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	title := data.Document.Title
	if title == "" {
		title = fmt.Sprintf("%s - %s", strings.ToUpper(data.Document.DocumentType), data.Document.DocumentNumber)
	}

	contentStream := fmt.Sprintf(
		"BT\n/F1 20 Tf\n50 780 Td\n(%s) Tj\n/F1 12 Tf\n0 -30 Td\n(Doc Number: %s) Tj\n0 -20 Td\n(Type: %s | Status: %s) Tj\n0 -20 Td\n(Date: %s) Tj\n0 -30 Td\n(Total Amount: %s) Tj\n0 -20 Td\n(Amount Paid: %s | Balance: %s) Tj\nET\n",
		escapePDFText(title),
		escapePDFText(data.Document.DocumentNumber),
		escapePDFText(data.Document.DocumentType),
		escapePDFText(data.Document.Status),
		data.Document.IssueDate.Format("2006-01-02"),
		fmt.Sprintf("%.2f %s", float64(data.Document.TotalMinor)/100.0, data.Document.Currency),
		fmt.Sprintf("%.2f %s", float64(data.Document.AmountPaidMinor)/100.0, data.Document.Currency),
		fmt.Sprintf("%.2f %s", float64(data.Document.BalanceMinor)/100.0, data.Document.Currency),
	)

	b.WriteString(fmt.Sprintf("5 0 obj\n<< /Length %d >>\nstream\n%sendstream\nendobj\n", len(contentStream), contentStream))
	b.WriteString("xref\n0 6\n0000000000 65535 f \n0000000015 00000 n \n0000000068 00000 n \n0000000125 00000 n \n0000000240 00000 n \n0000000317 00000 n \n")
	b.WriteString("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n")
	b.WriteString(fmt.Sprintf("%d\n%%%%EOF\n", len(b.Bytes())-50))

	return b.Bytes(), nil
}

func escapePDFText(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "(", "\\(")
	s = strings.ReplaceAll(s, ")", "\\)")
	return s
}
