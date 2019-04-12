FROM alpine:latest

ADD https://github.com/ericchiang/pup/releases/download/v0.4.0/pup_v0.4.0_linux_amd64.zip /
ADD https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 /

RUN apk update && apk upgrade && apk add bash nodejs npm make zip curl

RUN unzip pup_v0.4.0_linux_amd64.zip && \
    mv pup /usr/bin/pup && \
    rm pup_v0.4.0_linux_amd64.zip && \
    mv /jq-linux64 /usr/bin/jq && \
    chmod 755 /usr/bin/jq && \
    npm update -g npm && \
    npm install -g firebase-tools @vue/cli
