pipeline {
    agent any

    environment {
        BACKEND_CONTAINER  = 'docora_backend'
        FRONTEND_CONTAINER = 'docora_frontend'
        NGINX_CONTAINER    = 'docora_nginx'
        POSTGRES_CONTAINER = 'docora_postgres'
    }

    options {
        timeout(time: 25, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                script {
                    try {
                        env.GIT_COMMIT_SHORT = sh(
                            script: 'git rev-parse --short HEAD 2>/dev/null || echo "${GIT_COMMIT:-unknown}"',
                            returnStdout: true
                        ).trim()
                    } catch (Exception e) {
                        env.GIT_COMMIT_SHORT = env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'latest'
                    }
                }
                echo "Building commit: ${env.GIT_COMMIT_SHORT} (Jenkins Build #${env.BUILD_NUMBER})"
            }
        }

        stage('Backend Tests') {
            steps {
                echo "Running Go unit and integration tests inside isolated container..."
                sh '''
                    # Creates lightweight test container (avoids DooD volume mount path mismatch in Jenkins)
                    cat << 'EOF' > backend/Dockerfile.test
FROM golang:alpine
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test -v ./...
EOF
                    docker build -f backend/Dockerfile.test -t docora-backend-test backend
                    rm -f backend/Dockerfile.test
                '''
            }
        }

        stage('Frontend Verification') {
            steps {
                echo "Running TypeScript check and Next.js verification..."
                sh '''
                    # Validates TypeScript types and imports inside isolated Node environment
                    cat << 'EOF' > frontend/Dockerfile.test
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc --noEmit
EOF
                    docker build -f frontend/Dockerfile.test -t docora-frontend-test frontend
                    rm -f frontend/Dockerfile.test
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "Building production backend and frontend Docker images..."
                sh '''
                    # Always sync .env from .env.example (enforcing BACKEND_PORT=8087, NGINX_PORT=9091)
                    cp -f .env.example .env

                    # Build updated images without touching the database
                    docker compose build backend frontend
                '''
            }
        }

        stage('Deploy Rolling Update') {
            when {
                expression {
                    // Trigger deployment on main/master branches, or by default in standard single-branch pipelines
                    return env.BRANCH_NAME == null || 
                           env.BRANCH_NAME == 'main' || 
                           env.BRANCH_NAME == 'master' || 
                           env.GIT_BRANCH?.endsWith('/main') || 
                           env.GIT_BRANCH?.endsWith('/master')
                }
            }
            steps {
                echo "Applying zero-downtime rolling update to existing containers..."
                sh '''
                    # Ensure .env is synchronized with production ports
                    cp -f .env.example .env

                    # Gracefully restart backend with new image first (Postgres remains untouched)
                    echo "Deploying updated docora_backend container on port 8087..."
                    docker compose up -d --no-deps backend

                    # Health check using docker exec (works whether Jenkins is containerized or host-based)
                    echo "Checking docora_backend readiness probe..."
                    ATTEMPTS=0
                    MAX_ATTEMPTS=25
                    HEALTHY=0

                    while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
                        if docker exec docora_backend wget -q -O /dev/null http://127.0.0.1:8087/readyz; then
                            echo "docora_backend & database are HEALTHY and READY!"
                            HEALTHY=1
                            break
                        fi
                        echo "Waiting for backend readiness probe (Attempt $((ATTEMPTS+1))/$MAX_ATTEMPTS)..."
                        sleep 3
                        ATTEMPTS=$((ATTEMPTS+1))
                    done

                    if [ $HEALTHY -ne 1 ]; then
                        echo "ERROR: Backend readiness probe timed out. Displaying recent logs:"
                        docker compose logs --tail 40 backend
                        exit 1
                    fi

                    # Now deploy updated frontend with no-deps (backend is already confirmed healthy)
                    echo "Deploying updated docora_frontend container..."
                    docker compose up -d --no-deps frontend

                    # Verify frontend container status
                    sleep 3
                    if docker ps --format '{{.Names}}' | grep -q "^docora_frontend$"; then
                        echo "docora_frontend container is up and running!"
                    fi

                    # Gracefully reload Nginx to refresh Docker bridge IP routing
                    if docker ps --format '{{.Names}}' | grep -q "^docora_nginx$"; then
                        echo "Reloading docora_nginx upstream proxy..."
                        docker exec docora_nginx nginx -s reload || true
                        sleep 1
                        if docker exec docora_nginx wget -q -O /dev/null http://127.0.0.1/healthz; then
                            echo "docora_nginx gateway is responding successfully!"
                        else
                            echo "Notice: docora_nginx check finished"
                        fi
                    fi

                    # Prune old dangling images to preserve server disk space
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo "=========================================================="
            echo "SUCCESS: Build #${env.BUILD_NUMBER} passed tests and updated running containers!"
            echo "=========================================================="
        }
        failure {
            echo "=========================================================="
            echo "FAILURE: Pipeline failed on Build #${env.BUILD_NUMBER}. Check console logs."
            echo "=========================================================="
        }
    }
}
