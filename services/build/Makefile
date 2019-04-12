ORG=localgod
APP=ditspilbuild
VERSION=latest
IMAGE=${ORG}/${APP}:${VERSION}


.PHONY: build run

build:
	@docker build -t ${IMAGE} .

push:
	@docker push ${IMAGE}

run:
	@docker run --rm -it -v ${PWD}/../:/tmp -w /tmp ${IMAGE}
