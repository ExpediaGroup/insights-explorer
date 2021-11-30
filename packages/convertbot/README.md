# Insights Explorer Convertbot

Standalone service that facilitates conversion of documents between different file types. It is built on a Node.js Debian base image with pre-installed packages for converting various document types.

This is not a minimialist image!  Rather than focus on size, it aims to provide a comprehensive foundation for document conversions.

The latest version includes both [Unoconv](https://github.com/unoconv/unoconv) (for Office documents) and [nbconvert](https://nbconvert.readthedocs.io/en/latest/index.html) (for Jupyter notebooks).

<details style="margin-bottom: 1rem">
<summary>The following packages are installed</summary>


* Node.js 14.x
* nbconvert
* pandoc
* XeLaTeX
* Unoconv
* LibreOffice (headless)
* Ghostscript
* ImageMagick
* Various fonts
* Git
* Curl
* Nano

</details>

## Installation

```
npm install
```

## Configuration

[dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow)

## Docker Build

The Docker image must be built from the monorepo root:

```sh
docker build -t iex/convertbot:latest -f packages/convertbot/Dockerfile .
```

```sh
docker run iex/convertbot:latest
```

In order to provide AWS credentials, the following version can be used:

```sh
docker run --env-file packages/convertbot/env/.env.development.local iex/convertbot:latest
```

For development, mount a local folder as a volume and launch an interactive session:

```sh
docker run -it --volume ~/src:/opt/src iex/convertbot:latest /bin/bash
```

## Converting Files

Here are some sample commands for converting files:

```sh
unoconv -f pdf my-document.docx
unoconv -f pdf my-presentation.pptx
```

Converting an iPython notebook:
```sh
jupyter nbconvert my-notebook.ipynb --to markdown
jupyter nbconvert my-notebook.ipynb --to html
jupyter nbconvert my-notebook.ipynb --to pdf
```
