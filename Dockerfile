FROM node:14.17.1-buster

RUN apt-get update \
    && apt-get install -y \
    wget \
    build-essential \
    pkg-config \
    libglib2.0-dev \
    libexpat1-dev \
    libc6-dev \
    chromium \
    yarn

RUN wget https://github.com/libvips/libvips/releases/download/v8.11.0/vips-8.11.0.tar.gz \
    && tar xf vips-8.11.0.tar.gz \
    && cd vips-8.11.0 \ 
    && ./configure

RUN cd vips-8.11.0 \
    && make \
    && make install

COPY . /app/telnyx-meet

WORKDIR /app/telnyx-meet

RUN yarn

RUN yarn build

EXPOSE 3000

ENV PROXY_DOMAIN=video.telnyx.com
CMD ["yarn","dev"]
