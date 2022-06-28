FROM mcr.microsoft.com/playwright:v1.23.0-focal

RUN apt-get install --no-install-recommends -y wget=1.20.3-1ubuntu2 \
  && wget -q -O /usr/local/bin/waitforit https://github.com/maxcnunes/waitforit/releases/download/v2.4.1/waitforit-linux_amd64 \
  && chmod +x /usr/local/bin/waitforit

WORKDIR /playwright

RUN npm install @playwright/test@1.23.0

COPY . .
