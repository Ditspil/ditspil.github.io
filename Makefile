BUILD_IMAGE=localgod/ditspilbuild:latest

.PHONY: setup build server-start server-stop server_shell

# Start development environment
start:
	@docker-compose -f ditspil.dev.yml up -d

# Stop development environment
stop:
	@docker-compose -f ditspil.dev.yml down
