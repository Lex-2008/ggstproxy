docker run -d -v $PWD/data:/data -p 127.0.0.1:8000:8000 --restart=on-failure:3 --name=ggstproxy ggstproxy
