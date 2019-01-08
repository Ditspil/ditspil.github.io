BUILD_IMAGE=localgod/ditspilbuild:latest

.PHONY: setup build server-start server-stop server_shell

# Start docker image for development
server_start:
	@docker run --rm -dt --name ditspil_dev_server -v ${PWD}:/tmp -w /tmp -p 80:8080 ${BUILD_IMAGE} npm run serve

# Run shell on dev server
server_shell:
	@docker exec -i -t ditspil_dev_server bash

# View logs on dev server
server_logs:
	@docker logs ditspil_dev_server -f

# Stop dev server
server_stop:
	@docker rm -f ditspil_dev_server
