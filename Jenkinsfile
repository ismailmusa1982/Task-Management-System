pipeline {
  agent any
  environment {
    // Use just your Docker Hub username (without docker.io/ prefix)
    REGISTRY = 'ismailmusa1982'
    DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
  }
  stages {
    stage('Setup Kubernetes Secrets') {
      steps {
        script {
          withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
            // Use the kubeconfig for kubectl commands
            sh 'export KUBECONFIG=$KUBECONFIG_FILE'
            sh 'kubectl cluster-info'
            sh 'kubectl config get-contexts'
            // Update frontend secret
            withCredentials([string(credentialsId: 'VITE_SERVER_URL', variable: 'VITE_SERVER_URL')]) {
              sh """
                echo "Updating frontend secret..."
                kubectl delete secret frontend-secrets --ignore-not-found=true
                kubectl create secret generic frontend-secrets \\
                  --from-literal=VITE_SERVER_URL=${VITE_SERVER_URL} \\
                  --dry-run=client -o yaml | kubectl apply -f -
              """
            }
            // Update backend secret
            withCredentials([
              string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
              string(credentialsId: 'COOKIE_DOMAIN', variable: 'COOKIE_DOMAIN'),
              string(credentialsId: 'ISPRODUCTION', variable: 'ISPRODUCTION'),
              string(credentialsId: 'COOKIE_EXPIRE', variable: 'COOKIE_EXPIRE'),
              string(credentialsId: 'CLIENT_URL', variable: 'CLIENT_URL')
            ]) {
              sh """
                echo "Updating backend secret..."
                kubectl delete secret backend-secrets --ignore-not-found=true
                kubectl create secret generic backend-secrets \\
                  --from-literal=JWT_SECRET=${JWT_SECRET} \\
                  --from-literal=COOKIE_DOMAIN=${COOKIE_DOMAIN} \\
                  --from-literal=ISPRODUCTION=${ISPRODUCTION} \\
                  --from-literal=COOKIE_EXPIRE=${COOKIE_EXPIRE} \\
                  --from-literal=CLIENT_URL=${CLIENT_URL} \\
                  --dry-run=client -o yaml | kubectl apply -f -
              """
            }
          }
        }
      }
    }
    stage('Checkout Code') {
      steps {
        echo 'Checking out code from GitHub...'
        git branch: 'master', url: 'https://github.com/ismailmusa1982/Task-Management-System.git'
      }
    }
    stage('Build Docker Images') {
      steps {
        script {
          echo 'Building Docker images...'
          // Build and tag images as ismailmusa1982/task-frontend:latest and ismailmusa1982/task-backend:latest
          def frontendImage = docker.build("${env.REGISTRY}/task-frontend:latest", "-f client/Dockerfile client")
          def backendImage = docker.build("${env.REGISTRY}/task-backend:latest", "-f server/Dockerfile server")
        }
      }
    }
    stage('Push Docker Images') {
      steps {
        script {
          echo 'Pushing Docker images to Docker Hub...'
          // Using an empty string tells Docker to use the default Docker Hub endpoint
          docker.withRegistry('', env.DOCKER_CREDENTIALS_ID) {
            docker.image("${env.REGISTRY}/task-frontend:latest").push()
            docker.image("${env.REGISTRY}/task-backend:latest").push()
          }
        }
      }
    }
    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh 'export KUBECONFIG=$KUBECONFIG_FILE'
          echo 'Deploying updated manifests and restarting deployments...'
          sh 'kubectl apply -f k8s/'
          sh 'kubectl rollout restart deployment/frontend-deployment'
          sh 'kubectl rollout restart deployment/backend-deployment'
        }
      }
    }
  }
  post {
    always {
      echo 'Pipeline completed.'
    }
    failure {
      echo 'Pipeline failed. Check logs for details.'
    }
  }
}
