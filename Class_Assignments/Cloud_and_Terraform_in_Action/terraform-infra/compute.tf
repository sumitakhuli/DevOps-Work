# ---------- AMI: newest Ubuntu image published by Canonical ----------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-*-amd64-server-*"]
  }
}

# ---------- EC2: the web server ----------
resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.web.name

  # On boot: install nginx and copy the page from S3 using the instance's IAM role.
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y && apt-get install -y nginx awscli
    aws s3 cp s3://${aws_s3_bucket.assets.bucket}/${aws_s3_object.index.key} /var/www/html/index.html
    systemctl enable --now nginx
  EOF

  # user_data reads the object at boot, but only references the bucket and key *names*.
  # depends_on makes Terraform wait until the object itself has been uploaded.
  depends_on = [aws_s3_object.index, aws_route_table_association.public]

  tags = { Name = "${var.project}-web" }
}
