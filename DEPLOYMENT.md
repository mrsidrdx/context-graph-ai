# AWS ECS Deployment Guide

This guide walks you through deploying the Context AI application to AWS ECS using Terraform and GitHub Actions for automated CI/CD.

## Architecture Overview

The deployment includes:
- **ECS Fargate**: Runs your containerized application (app, Neo4j, Redis, MongoDB)
- **Application Load Balancer (ALB)**: Public-facing HTTP endpoint
- **ECR**: Stores Docker images
- **EFS**: Persistent storage for databases (Neo4j, Redis, MongoDB)
- **VPC**: Network with 2 public subnets across availability zones
- **Security Groups**: Properly configured firewall rules

## Prerequisites

### Local Requirements
- AWS CLI installed and configured
- Terraform >= 1.0
- Git
- GitHub account with repository access

### AWS Requirements
- AWS account with administrative access
- AWS CLI configured with credentials (`aws configure`)

### Secrets Required
- Neo4j password
- Anthropic API key
- JWT secret (minimum 32 characters)

---

## Part 1: Infrastructure Setup with Terraform

### Step 1: Configure Terraform Variables

1. Navigate to the terraform directory:
```bash
cd terraform
```

2. Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```

3. Edit `terraform.tfvars` with your actual values:
```hcl
aws_region         = "us-east-1"
project_name       = "context-ai"
neo4j_password     = "your-secure-neo4j-password"
anthropic_api_key  = "sk-ant-your-api-key"
jwt_secret         = "your-super-secret-jwt-key-min-32-chars"
```

### Step 2: Initialize Terraform

```bash
terraform init
```

This downloads the AWS provider and initializes the backend.

### Step 3: Preview Infrastructure Changes

```bash
terraform plan
```

Review the resources that will be created:
- VPC with 2 public subnets
- Internet Gateway and Route Tables
- 5 Security Groups (ALB, ECS, Neo4j, Redis, MongoDB, EFS)
- Application Load Balancer
- ECS Cluster and Service
- 4 ECR Repositories
- EFS File System
- CloudWatch Log Groups
- IAM Roles

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This will take 5-10 minutes.

### Step 5: Save Output Values

After deployment completes, save these important outputs:

```bash
terraform output
```

You'll need:
- `alb_dns_name` - Your application URL
- `ecr_app_repository_url` - ECR repository for your app
- `ecs_cluster_name` - ECS cluster name
- `ecs_service_name` - ECS service name

**Example output:**
```
alb_dns_name = "context-ai-alb-1234567890.us-east-1.elb.amazonaws.com"
alb_url = "http://context-ai-alb-1234567890.us-east-1.elb.amazonaws.com"
ecr_app_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com/context-ai-app"
ecs_cluster_name = "context-ai-cluster"
ecs_service_name = "context-ai-service"
```

---

## Part 2: Initial Docker Image Push

Before GitHub Actions can deploy, you need to push an initial image to ECR.

### Step 1: Authenticate with ECR

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Initial Image

```bash
# Navigate to project root
cd ..

# Get ECR repository URL from Terraform
ECR_REPO=$(cd terraform && terraform output -raw ecr_app_repository_url)

# Build the Docker image
docker build --platform linux/amd64 -t "${ECR_REPO}:latest" .

# Push to ECR
docker push "${ECR_REPO}:latest"
```

### Step 3: Verify Image in ECR

```bash
aws ecr describe-images --repository-name context-ai-app --region us-east-1
```

### Step 4: Wait for ECS Service to Start

The ECS service will automatically pull the image and start the containers. This takes 3-5 minutes.

```bash
# Check service status
aws ecs describe-services \
  --cluster context-ai-cluster \
  --services context-ai-service \
  --region us-east-1 \
  --query 'services[0].deployments'
```

### Step 5: Access Your Application

Once the service is running, access your application:

```bash
# Get ALB DNS name
terraform output -raw alb_url
```

Visit the URL in your browser: `http://context-ai-alb-xxxxx.us-east-1.elb.amazonaws.com`

---

## Part 3: GitHub Actions Setup

Now configure automated deployments on every push to main branch.

### Step 1: Create AWS IAM User for GitHub Actions

```bash
# Create IAM user
aws iam create-user --user-name github-actions-ecs-deploy

# Create policy for GitHub Actions
cat > github-actions-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeImages",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:ListTasks",
        "ecs:DescribeTasks",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy
aws iam put-user-policy \
  --user-name github-actions-ecs-deploy \
  --policy-name GitHubActionsECSPolicy \
  --policy-document file://github-actions-policy.json

# Create access keys
aws iam create-access-key --user-name github-actions-ecs-deploy
```

**Save the AccessKeyId and SecretAccessKey from the output!**

### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `NEO4J_PASSWORD` | Neo4j password | `your-secure-neo4j-password` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-your-api-key` |
| `JWT_SECRET` | JWT secret | `your-super-secret-jwt-key-min-32-chars` |
| `ALB_DNS_NAME` | ALB DNS name from Terraform | `context-ai-alb-xxxxx.us-east-1.elb.amazonaws.com` |

### Step 3: Commit and Push GitHub Actions Workflow

The workflow file is already created at `.github/workflows/deploy.yml`.

```bash
git add .github/workflows/deploy.yml
git add terraform/
git commit -m "Add AWS ECS deployment infrastructure and CI/CD"
git push origin main
```

### Step 4: Monitor Deployment

1. Go to GitHub repository → Actions tab
2. Click on the running workflow
3. Watch the deployment steps:
   - Build and push Docker image to ECR
   - Update task definition with new image
   - Deploy to ECS
   - Wait for service stabilization

The deployment takes approximately 5-7 minutes.

### Step 5: Verify Deployment

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster context-ai-cluster \
  --services context-ai-service \
  --region us-east-1

# Check running tasks
aws ecs list-tasks \
  --cluster context-ai-cluster \
  --service-name context-ai-service \
  --region us-east-1

# View logs
aws logs tail /ecs/context-ai-app --follow --region us-east-1
```

---

## Part 4: Using the Application

### Access the Application

Your application is now available at:
```
http://<ALB_DNS_NAME>
```

### Register and Seed Data

1. **Register an account:**
   - Navigate to the application URL
   - Click "Register" and create an account
   - Login with your credentials

2. **Seed knowledge graph:**

After logging in, you need to seed the knowledge graph. Get your session cookie from the browser and run:

```bash
# Replace <SESSION_COOKIE> with your actual session cookie from browser
curl -X POST http://<ALB_DNS_NAME>/api/seed \
  -H "Content-Type: application/json" \
  -d @data/seed-developer.json \
  --cookie "session=<SESSION_COOKIE>"
```

Or use the browser's developer tools to get the cookie and make the request.

---

## Part 5: Maintenance & Operations

### View Logs

```bash
# App logs
aws logs tail /ecs/context-ai-app --follow

# Neo4j logs
aws logs tail /ecs/context-ai-neo4j --follow

# Redis logs
aws logs tail /ecs/context-ai-redis --follow

# MongoDB logs
aws logs tail /ecs/context-ai-mongodb --follow
```

### Scale the Service

```bash
# Scale to 2 tasks
aws ecs update-service \
  --cluster context-ai-cluster \
  --service context-ai-service \
  --desired-count 2
```

### Restart Service (Force New Deployment)

```bash
aws ecs update-service \
  --cluster context-ai-cluster \
  --service context-ai-service \
  --force-new-deployment
```

### Update Environment Variables

1. Edit `terraform/main.tf` - update the environment variables in the task definition
2. Run `terraform apply`
3. Force new deployment:
```bash
aws ecs update-service \
  --cluster context-ai-cluster \
  --service context-ai-service \
  --force-new-deployment
```

### Access Neo4j Browser

To access Neo4j browser for debugging:

```bash
# Port forward to running task
# First, get the task ID
TASK_ID=$(aws ecs list-tasks \
  --cluster context-ai-cluster \
  --service-name context-ai-service \
  --query 'taskArns[0]' \
  --output text | cut -d'/' -f3)

# Use ECS Exec to connect (requires AWS Session Manager plugin)
aws ecs execute-command \
  --cluster context-ai-cluster \
  --task $TASK_ID \
  --container neo4j \
  --interactive \
  --command "/bin/bash"
```

---

## Part 6: Troubleshooting

### Service Won't Start

**Check task failures:**
```bash
aws ecs describe-tasks \
  --cluster context-ai-cluster \
  --tasks $(aws ecs list-tasks --cluster context-ai-cluster --service-name context-ai-service --query 'taskArns[0]' --output text) \
  --query 'tasks[0].containers[*].[name,lastStatus,reason]'
```

**Check service events:**
```bash
aws ecs describe-services \
  --cluster context-ai-cluster \
  --services context-ai-service \
  --query 'services[0].events[0:10]'
```

### Health Check Failures

The app container depends on Neo4j, Redis, and MongoDB being healthy. Check individual container logs:

```bash
aws logs tail /ecs/context-ai-neo4j --follow
aws logs tail /ecs/context-ai-redis --follow
aws logs tail /ecs/context-ai-mongodb --follow
```

### Can't Access Application

**Check target group health:**
```bash
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --names context-ai-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

aws elbv2 describe-target-health \
  --target-group-arn $TARGET_GROUP_ARN
```

**Check security groups:**
```bash
# Ensure ALB security group allows inbound port 80
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=context-ai-alb-sg" \
  --query 'SecurityGroups[0].IpPermissions'
```

### GitHub Actions Deployment Fails

**Common issues:**
1. **AWS credentials expired** - Regenerate IAM access keys
2. **ECR authentication failed** - Check IAM policy permissions
3. **Task definition registration failed** - Check JSON syntax in workflow
4. **Service update timeout** - Check ECS service events and logs
5. **CannotPullContainerError: platform 'linux/amd64'** - Image not built for correct platform

### CannotPullContainerError: Platform Issues

If you see "CannotPullContainerError: pull image manifest has been retried 7 time(s): image Manifest does not contain descriptor matching platform 'linux/amd64'":

**Root Cause:** The Docker image was built for a different platform or using Alpine Linux which has compatibility issues with ECS Fargate.

**Solutions:**
1. **Changed base image:** Dockerfile now uses `node:20-slim` instead of `node:20-alpine`
2. **Platform specification:** GitHub Actions now builds with `--platform linux/amd64`
3. **Rebuild and redeploy:** Push to main branch to trigger new build with correct platform

The image must be built specifically for `linux/amd64` platform to work with ECS Fargate.

### EFS Mount Errors

If you see "ResourceInitializationError: failed to invoke EFS utils commands to set up EFS volumes: stderr: b'mount.nfs4: mounting ... failed, reason given by server: No such file or directory'":

**Root Cause:** EFS volume configuration was trying to mount non-existent subdirectories.

**Solutions:**
1. **Fixed root directory:** Changed EFS `root_directory` from service-specific paths to `"/"` 
2. **Updated container paths:** Each service now uses subdirectories to avoid conflicts:
   - Neo4j: `/data/neo4j`
   - Redis: `/data/redis` 
   - MongoDB: `/data/mongodb/db`
3. **Updated service configurations:** Added proper data directory parameters for each service

**Apply the fix:**
```bash
cd terraform
terraform apply
```

### MongoDB Exit Code 137 (OOM Kill)

If you see MongoDB container exiting with code 137, this indicates an Out of Memory (OOM) kill by the Linux kernel.

**Root Cause**: Exit code 137 = SIGKILL (128 + 9). This happens when:
1. Container memory not explicitly allocated in task definition (containers compete for task memory)
2. MongoDB WiredTiger cache not limited (defaults to 50% of available RAM)
3. Total task memory insufficient for all containers

**Critical Understanding - ECS Fargate Memory Model**:
- Task-level memory (e.g., 16GB) is shared among ALL containers
- Without container-level `memory` parameter, containers can consume unlimited task memory
- One container can starve others, causing kernel OOM killer to terminate processes

**Solution Applied** (v5+ task definition):
```hcl
# Task: 4 vCPUs, 16GB total memory
cpu    = "4096"
memory = "16384"

# Container allocations (total ~16GB):
# - app:     2GB  (Next.js application)
# - neo4j:   4GB  (Graph database with 3GB heap + 512MB pagecache)
# - redis:   2GB  (Cache with 1.5GB maxmemory)
# - mongodb: 8GB  (Document store with 6GB WiredTiger cache)
```

**Verify Fix**:
```bash
# Check task definition has container memory
aws ecs describe-task-definition --task-definition context-ai-app \
  --region us-east-1 --query 'taskDefinition.containerDefinitions[*].[name,memory]'

# Should show:
# [["app", 2048], ["neo4j", 4096], ["redis", 2048], ["mongodb", 8192]]

# Apply new task definition
cd terraform
terraform apply -target=aws_ecs_task_definition.app

# Force new deployment
aws ecs update-service --cluster context-ai-cluster \
  --service context-ai-service --force-new-deployment --region us-east-1

# Monitor for OOM kills
aws ecs describe-tasks \
  --cluster context-ai-cluster \
  --tasks $(aws ecs list-tasks --cluster context-ai-cluster --service context-ai-service --region us-east-1 --query 'taskArns[0]' --output text) \
  --region us-east-1 --query 'tasks[0].containers[*].[name,exitCode,reason]'
```

**Memory Configuration Details**:

1. **MongoDB WiredTiger Cache**:
   ```bash
   --wiredTigerCacheSizeGB 6
   # Limits WiredTiger cache to 6GB out of 8GB container memory
   # Leaves ~2GB for connections, operations, and OS overhead
   ```

2. **Neo4j Heap + Pagecache**:
   ```bash
   NEO4J_dbms_memory_heap_initial__size=2G
   NEO4J_dbms_memory_heap_max__size=3G
   NEO4J_server_memory_pagecache_size=512m
   # Total: 3.5GB out of 4GB container memory
   ```

3. **Redis Maxmemory**:
   ```bash
   --maxmemory 1500mb --maxmemory-policy allkeys-lru
   # Limits Redis to 1.5GB out of 2GB, evicts LRU keys when full
   ```

**Monitoring Commands**:
```bash
# Real-time container resource usage (requires ECS Exec)
aws ecs execute-command --cluster context-ai-cluster \
  --task <task-id> --container mongodb \
  --command "sh -c 'free -h && ps aux --sort=-%mem | head -10'" \
  --interactive --region us-east-1

# CloudWatch Container Insights metrics
aws cloudwatch get-metric-statistics \
  --namespace ECS/ContainerInsights \
  --metric-name MemoryUtilized \
  --dimensions Name=ClusterName,Value=context-ai-cluster Name=ServiceName,Value=context-ai-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 --statistics Average \
  --region us-east-1
```

**If Still Failing**:
1. Check MongoDB logs for memory warnings:
   ```bash
   aws logs tail /ecs/context-ai-mongodb --since 30m --region us-east-1 | grep -i "memory\|cache\|oom"
   ```

2. Increase task memory further (ECS Fargate CPU/Memory combinations):
   - 4 vCPUs supports: 8GB to 30GB (1GB increments)
   - Consider 8 vCPUs with 32GB for production workloads

3. Consider splitting services into separate ECS tasks with dedicated resources

### Database Data Lost

Data is persisted on EFS. To verify:

```bash
# Check EFS mount targets
aws efs describe-mount-targets \
  --file-system-id $(terraform output -raw efs_id)

# Check EFS is mounted in containers - exec into task
aws ecs execute-command \
  --cluster context-ai-cluster \
  --task <TASK_ID> \
  --container app \
  --interactive \
  --command "/bin/sh -c 'df -h'"
```

---

## Part 7: Cleanup

To destroy all resources and avoid AWS charges:

```bash
# Navigate to terraform directory
cd terraform

# Destroy all infrastructure
terraform destroy
```

Type `yes` when prompted. This will delete:
- ECS cluster and service
- Application Load Balancer
- ECR repositories and images
- EFS file system and data
- VPC and networking components
- CloudWatch logs
- IAM roles

**⚠️ Warning: This will permanently delete all data!**

---

## Cost Estimation

Approximate monthly costs (us-east-1):
- **ECS Fargate** (1 task, 4 vCPUs, 16GB RAM): ~$120
- **Application Load Balancer**: ~$20
- **EFS Storage** (10GB): ~$3
- **ECR Storage** (5GB): ~$0.50
- **CloudWatch Logs** (5GB): ~$2.50
- **Data Transfer**: ~$5

**Total: ~$151/month**

To reduce costs:
- Stop the ECS service when not in use: `aws ecs update-service --cluster context-ai-cluster --service context-ai-service --desired-count 0 --region us-east-1`
- Use smaller Fargate task size for development (2 vCPUs, 8GB RAM): ~$60/month
- Clean up old ECR images regularly
- Consider reserved capacity for production workloads

---

## Security Considerations

### Current Setup (MVP)
✅ Environment variables in plain text (as requested)  
✅ Public ALB access  
✅ EFS encryption at rest  
✅ ECR image scanning disabled (Alpine Linux not supported)  

### Production Recommendations
- Use **AWS Secrets Manager** for sensitive environment variables
- Enable **HTTPS** with ACM certificate on ALB
- Use **private subnets** for ECS tasks with NAT Gateway
- Enable **VPC Flow Logs** for network monitoring
- Set up **AWS WAF** on ALB for protection
- Use **RDS** instead of containerized databases
- Enable **ECS Exec logging** for audit trails
- Implement **IAM roles with least privilege**

---

## Summary

You now have:

✅ Fully automated infrastructure with Terraform  
✅ CI/CD pipeline with GitHub Actions  
✅ ECS Fargate deployment with all services  
✅ Persistent storage with EFS  
✅ Public access via Application Load Balancer  
✅ Automated deployments on every push to main  

Every push to main branch will automatically:
1. Build new Docker image
2. Push to ECR
3. Update ECS task definition
4. Deploy new version to ECS
5. Wait for healthy deployment

**Your application URL:** `http://<ALB_DNS_NAME>`

For questions or issues, check the troubleshooting section or AWS CloudWatch logs.
