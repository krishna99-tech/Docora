pipeline {
    agent any

    environment {
        BACKEND_CONTAINER  = 'docora_backend'
        FRONTEND_CONTAINER = 'docora_frontend'
        NGINX_CONTAINER    = 'docora_nginx'
        POSTGRES_CONTAINER = 'docora_postgres'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD 2>/dev/null || echo "unknown"',
                        returnStdout: true
                    ).trim()
                }
                echo "Building commit: ${env.GIT_COMMIT_SHORT} (Jenkins Build #${env.BUILD_NUMBER})"
            }
        }

        stage('Backend Tests') {
            steps {
                echo "Running Go unit and integration tests inside official Go runner..."
                sh '''
                    # Runs Go tests inside containerized Go environment (no host dependencies required)
                    docker run --rm \
                        -v "$(pwd)/backend":/app \
                        -w /app \
                        golang:1.24-alpine \
                        sh -c "go test -v ./tests/..."
                '''
            }
        }

        stage('Frontend Verification') {
            steps {
                echo "Running TypeScript check and Next.js verification..."
                sh '''
                    # Verifies TypeScript integrity inside Node environment
                    docker run --rm \
                        -v "$(pwd)/frontend":/app \
                        -w /app \
                        node:22-alpine \
                        sh -c "npm install && npx tsc --noEmit"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "Building updated backend and frontend Docker images..."
                sh '''
                    # Ensure .env exists with defaults if not present
                    if [ ! -f .env ]; then
                        cp .env.example .env
                    fi

                    # Build updated images without touching the database
                    docker compose build backend frontend
                '''
            }
        }

        stage('Deploy Rolling Update') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo "Applying zero-downtime rolling update to existing containers..."
                sh '''
                    # Gracefully restart backend & frontend with new images (Postgres remains untouched)
                    docker compose up -d --no-deps backend frontend

                    # Health check using docker exec (works whether Jenkins is containerized or host-based)
                    echo "Checking docora_backend readiness probe..."
                    ATTEMPTS=0
                    MAX_ATTEMPTS=15
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

                    # Verify Nginx gateway proxy
                    if docker ps --format '{{.Names}}' | grep -q "^docora_nginx$"; then
                        docker exec docora_nginx wget -q -O /dev/null http://127.0.0.1/healthz && \
                            echo "docora_nginx gateway is responding successfully!" || true
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
