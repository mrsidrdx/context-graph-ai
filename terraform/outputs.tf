output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_app_repository_url" {
  description = "URL of the ECR repository for the app"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_neo4j_repository_url" {
  description = "URL of the ECR repository for Neo4j"
  value       = aws_ecr_repository.neo4j.repository_url
}

output "ecr_redis_repository_url" {
  description = "URL of the ECR repository for Redis"
  value       = aws_ecr_repository.redis.repository_url
}

output "ecr_mongodb_repository_url" {
  description = "URL of the ECR repository for MongoDB"
  value       = aws_ecr_repository.mongodb.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "efs_id" {
  description = "ID of the EFS file system"
  value       = aws_efs_file_system.data.id
}
