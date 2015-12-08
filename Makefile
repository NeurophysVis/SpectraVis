## Markdown extension (e.g. md, markdown, mdown).
MEXT = md

## All markdown files in the working directory
SRC = $(wildcard *.$(MEXT))

HTML=$(SRC:.md=.html)
CSS=$(SRC:.md=.css)

all:
	pandoc description.md -c description.css -w html -S --mathjax -o description.html
