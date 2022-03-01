FROM alpine

RUN apk --no-cache add lighttpd openssl

EXPOSE 8000
USER 1000:1000
CMD ["lighttpd", "-D", "-f", "/data/lighttpd.conf"]
