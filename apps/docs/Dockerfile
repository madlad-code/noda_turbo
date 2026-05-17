# =================================================================
# FILE: apps/docs/Dockerfile
# This is the final, correct version.
# =================================================================
FROM rust:1.80-slim

# Install the correct, locked version of mdBook for stability
RUN cargo install mdbook --version 0.4.48 --locked

# Set the working directory that mdBook will use
WORKDIR /book

# Copy all the documentation source files into the container's
# working directory.
COPY ./apps/docs/ .

# Expose the port mdBook will run on
EXPOSE 3000

# Run the server. By setting the WORKDIR, mdBook automatically
# finds the book.toml and src/ folder here.
CMD ["mdbook", "serve", "--hostname", "0.0.0.0", "--port", "3000"]