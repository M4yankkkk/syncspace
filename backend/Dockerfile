FROM golang:alpine
WORKDIR /app
COPY . .
RUN rm -f go.sum && go get -u ./... && go mod tidy
RUN go build -o main .
EXPOSE 8080
CMD ["./main"]
