package tests

import (
	"testing"

	"docora/backend/internal/models"
	"docora/backend/internal/services"
)

func TestCalculateDocumentTotals(t *testing.T) {
	items := []models.ItemInput{
		{
			Description:    "Professional Consulting (2.5 hrs)",
			Quantity:       2.5,
			UnitPriceMinor: 10000, // $100.00
			DiscountMinor:  2000,  // $20.00 discount
			TaxRate:        0.10,  // 10% tax
		},
		{
			Description:    "Digital Asset License",
			Quantity:       1.0,
			UnitPriceMinor: 5000, // $50.00
			DiscountMinor:  0,
			TaxRate:        0.05, // 5% tax
		},
	}

	// Gross:
	// Item 1: 2.5 * 10000 = 25000 ($250.00)
	// Discount: 2000 ($20.00)
	// Taxable: 23000 ($230.00)
	// Tax: 10% of 23000 = 2300 ($23.00)
	// Line 1 Total: 23000 + 2300 = 25300 ($253.00)

	// Item 2: 1.0 * 5000 = 5000 ($50.00)
	// Discount: 0
	// Taxable: 5000
	// Tax: 5% of 5000 = 250 ($2.50)
	// Line 2 Total: 5250 ($52.50)

	// Subtotal: 25000 + 5000 = 30000 ($300.00)
	// Discount: 2000 ($20.00)
	// Tax: 2300 + 250 = 2550 ($25.50)
	// Total: 30000 - 2000 + 2550 = 30550 ($305.50)

	amountPaidMinor := int64(15000) // Paid $150.00
	// Balance: 30550 - 15000 = 15550 ($155.50)

	calcItems, subtotal, discount, tax, total, balance := services.CalculateDocumentTotals(items, amountPaidMinor)

	if len(calcItems) != 2 {
		t.Fatalf("expected 2 items, got %d", len(calcItems))
	}
	if calcItems[0].LineTotalMinor != 25300 {
		t.Errorf("expected item 0 line total 25300, got %d", calcItems[0].LineTotalMinor)
	}
	if calcItems[1].LineTotalMinor != 5250 {
		t.Errorf("expected item 1 line total 5250, got %d", calcItems[1].LineTotalMinor)
	}
	if subtotal != 30000 {
		t.Errorf("expected subtotal 30000, got %d", subtotal)
	}
	if discount != 2000 {
		t.Errorf("expected discount 2000, got %d", discount)
	}
	if tax != 2550 {
		t.Errorf("expected tax 2550, got %d", tax)
	}
	if total != 30550 {
		t.Errorf("expected total 30550, got %d", total)
	}
	if balance != 15550 {
		t.Errorf("expected balance 15550, got %d", balance)
	}
}

func TestCalculateDocumentTotalsNoItems(t *testing.T) {
	calcItems, subtotal, discount, tax, total, balance := services.CalculateDocumentTotals([]models.ItemInput{}, 0)
	if len(calcItems) != 0 || subtotal != 0 || discount != 0 || tax != 0 || total != 0 || balance != 0 {
		t.Errorf("expected all zeros for empty items, got total=%d balance=%d", total, balance)
	}
}
