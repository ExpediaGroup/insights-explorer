# Markdown

Markdown is a widely-used markup language which can easily be rendered into HTML. Insights Explorer uses
Markdown for Insight contents (and comments), and this page is intended as a reference guide to the
particular flavor that IEX supports.

Insights Explorer uses its own Markdown variant, based largely on [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/).  Any IEX-specific features are denoted with an  :badge[IEX]{variant=frost} badge.

For more details on the origins of Markdown please refer additionally
to [John Gruber's original spec](https://daringfireball.net/projects/markdown/)
and the [CommonMark](https://commonmark.org/) spec.


# Basic Syntax

## Headings

To create headings, add one or more number signs (#) at the start of a line. Add additional number signs to
increase the level of nesting.

```md
# The largest heading
## The second largest heading
### The third heading
#### The fourth heading
##### The fifth heading
###### The sixth heading
```

# The largest heading
## The second largest heading
### The third heading
#### The fourth heading
##### The fifth heading
###### The sixth heading

Alternatively, for H1 and H2, an underline-ish style is supported:

```md
Alternate Largest Heading
======

Alternate Second Largest Heading
------
```

Alternate Largest Heading
======

Alternate Second Largest Heading
------

## Paragraphs

Paragraphs are composed of adjacent lines of text, and separated by empty lines (or other Markdown features).

```md
First paragraph.

Second paragraph.
```

If you need an additional line break, you can use the HTML break tag `<br />` surrounded by blank lines:

```md
First paragraph

<br />

Second paragraph
```

## Character Styles

Add emphasis by making text **bold**, _italic_, or ~~strikethrough~~.

```md
Italic text with *asterisks* or _underscores_.

Bold text with **asterisks** or __underscores__.

Bold italic text with ***asterisks*** or ___underscores___.

Strikethrough text with ~~tildes~~
```

## Block Quotes

Block quotes are a good way to embed a quote or excerpt in a document.

> Block quotes are offset from normal text.
> They can be multiple lines long

Add a non-quoted line of text to separate multiple quotes.

> This is a second quote

```md
> Block quotes are offset from normal text.
> They can be multiple lines long.

Add a non-quoted line of text to separate multiple quotes.

> This is a second quote.
```

## Lists

### Unordered Lists

Unordered lists are created by starting one or more lines with a dash (`-`), asterisk (`*`), or plus sign (`+`).

```md
* Item 1
* Item 2
* Item 3
```

* Item 1
* Item 2
* Item 3

### Ordered Lists

To create an ordered list, start each line with a number and a period.  The actual numbers don't matter, so it's fine if they get misnumbered.

```md
1. Step 1
2. Step 2
3. Step 3
```

1. Step 1
2. Step 2
3. Step 3

### Nested Lists

Nested lists are created by indenting additional list items.

```md
1. First level first item
   1. Second level
   2. Nested item
2. First level second item
```

1. First level first item
   1. Second level
   2. Nested item
2. First level second item

The level of indent should align with the content in the parent line.

Both unordered and ordered lists can be nested, and nested lists can be of a different type (e.g. an ordered list can be nested in an unordered list).

### Additional Nested Content

Additional content can be nested inside a list by aligning it with the parent list item, just like nested lists.

```md
* First step

  Nested content about the first step

* Second step
* Third step
```

* First step

  Nested content about the first step

* Second step
* Third step

## Links

Links are created by wrapping the link text in brackets `[ ]`, followed by the URL in parentheses `( )`.

```md
[CommonMark](https://commonmark.org/)
```

[CommonMark](https://commonmark.org/)

### Autolinks

Valid URLs included in normal text will automatically be turned into links, using the URL itself as the link text.

```md
Here's a link to https://www.wikipedia.org/.
```

Here's a link to https://www.wikipedia.org/.

### Section Links

Link to specific sections of a document using a `#hash` link, where `#hash` is the `id` of an HTML element.  Insights Explorer adds an `id` property to all Insight headings automatically.

Use `#hash` alone to link within the current document, or combine with a full URL to link to a section within another page.

```md
[Basic Syntax](#basic-syntax)
```

[Basic Syntax](#basic-syntax)

### Relative Links

Within an Insight, relative links can be used to link to other pages in the Insight.

```md
[Another Page](/another-page.md)
```

### Reference Links

Reference links separate the link text from the actual URL, allowing the URL to be organized elsewhere in the document using an identifier. Multiple links can share the same identifier, which is useful for repeated links.

This is only for the convenience of the author; it will render the same as other links.

```md
[CommonMark][1]

[1]: https://commonmark.org/
```

[CommonMark][1]

[1]: https://commonmark.org/

The actual reference label can be an arbitrary text or number.

It's also possible to skip the link text, causing the reference itself to appear as the link:


```md
[CommonMark]

[CommonMark]: https://commonmark.org/
```

[CommonMark]

[CommonMark]: https://commonmark.org/

## Images

Images can be included with this syntax: `![alt text](url "title")`.  Alt text and title are optional.

```md
![alt text](https://commonmark.org/help/images/favicon.png "Markdown Logo")
```

![alt text](https://commonmark.org/help/images/favicon.png "Markdown Logo")

Spaces in image URLs need special consideration to be parsed correctly. One option is to URL-encode the image path, replacing each space with `%20`.  The other option is to wrap the URL with `<` angle brackets `>`.

```md
![screen shot.png](screen%20shot.png)

![screen shot.png](<screen shot.png>)
```

The standard Markdown syntax does not provide any other options e.g. scaling, positioning, etc.  The custom [`:image` directive](#images-directive-iex) can be used for more advanced cases.

### Relative URLs

Within an Insight, a relative path can be used to embed an image that is contained within that Insight.

```md
![](/images/architecture.png)
```

### Identifiers

As with links, an identifier can also be used to reference the URL. This is useful when an image is used in multiple locations, or to keep a document cleaner and more organized.  The identifier can be located anywhere in the document.

```md
![alt text][logo]

[logo]: https://commonmark.org/help/images/favicon.png "Markdown Logo"
```

## Code

### Inline Code

Text wrapped in single backticks will be formatted as `inline` code.

```md
Text wrapped in single backticks will be formatted as `inline` code.
```

### Code Blocks

Larger sections of code should be formatted into their own blocks. There are two ways to create a code block: `fences` and `indented`.

Fences are recommended both for clarity and to enable additional features like [syntax highlighting](#syntax-highlighting).

#### Fenced Code Blocks

To make a fenced code block, wrap code between two "fences" of three backticks (` ``` `).

    ```
    SELECT * FROM iex.insight
    ```

#### Indented Code Blocks

To make an indented code block, indent all lines by 4 spaces:

```md
    SELECT * FROM iex.insight
```

#### Nested Code Blocks

You can combine the two code block syntaxes if you want to display a code block within a code block.

```md
    ```
    SELECT * FROM iex.insight
    ```
```

#### Collapsed Code Blocks

Code blocks typically appear expanded and can be manually collapsed if needed.  This can be reversed by adding a `collapse` attribute, which may be useful to keep very long code blocks from dominating a document.

    ```sql {collapse}
    SELECT *
    FROM iex.insight
    WHERE ...
    ```

```sql {collapse}
SELECT *
FROM iex.insight
WHERE ...
```

#### Included Code Blocks

Often it may be beneficial to store code in a separate file rather than in a Markdown document.  It's possible to dynamically include the contents of a file into a code block by adding a `file=URL` attribute to a fenced code block:

    ```yml {file=https://raw.githubusercontent.com/ExpediaGroup/insights-explorer/main/codegen.yml}
    ```

The contents of the URL are loaded on-demand and displayed in the same manner as other code blocks:

```yml {file=https://raw.githubusercontent.com/ExpediaGroup/insights-explorer/main/codegen.yml}
```

Within an Insight this URL can be a relative path to a file contained within the Insight.

Additionally, the optional `lines=` attribute supports selecting portions of the included document. The value can be a combination of one or more lines or ranges separated by commas (`,`) or semicolons (`;`).

    ```js {lines=43..52 file="https://raw.githubusercontent.com/ExpediaGroup/insights-explorer/v2.0.4/packages/frontend/src/shared/remark/remark-code-plus.ts"}
    ```


```js {lines=43..52 file="https://raw.githubusercontent.com/ExpediaGroup/insights-explorer/v2.0.4/packages/frontend/src/shared/remark/remark-code-plus.ts"}
```

Numbers by themselves indicate a single line to be included; two numbers separated by two periods (`..`) indicate an inclusive range of lines.

If the trailing number in a range is missing, the range extends to the end of the document.  If the trailing number in a range is negative, it indicates an offset from the end of the document, e.g. `-1` means omit the last line, `-2` means omit the last 2 lines, etc.

Additional examples:

- `lines=1..10,30..40` - includes 2 separate ranges
- `lines=1,5,10` - includes 3 specific lines
- `lines=50..` - includes everything from line 50 to the end of the document
- `lines=50..-1` - includes everything starting at line 50 and ending 1 line before the end of the document

When lines are specified, the line numbering displayed in the code block will start with the earliest included line and continue from there.  The displayed line numbers will not accurately track multiple ranges.

## Horizontal Lines

To create a horizontal line, use three or more asterisks (***), dashes (---), or underscores (___) on a line.

```md
***
---
___
```

They all produce the same result:

***

<br>
<br>

---

<br>
<br>

___

## Comments

HTML comments can be used to include some content that will not be rendered.

```md
<!-- This is a comment and will not be displayed -->
```

<!-- This is a comment and will not be displayed -->

## Escaping Characters

To display literal characters that would otherwise be interpreted as a format character, add a backslash (\\) in front of the character.

```md
\- This line is not part of a list

\# This is not a \*heading\*

- [x] \(Optional) Add emojis for bling
```

\- This line is not part of a list

\# This is not a \*heading\*

- [x] \(Optional) Add emojis for bling

# Advanced Features

## Table of Contents :badge[IEX]{variant=frost fontSize=1.2rem}

A table of contents can be automatically generated for an entire Markdown document by adding a heading named `# Table of Contents`.

Headings after the table of contents heading will be automatically pulled into a nested list.  Any level of heading can be used.

Content cannot be nested under the table of contents heading; any content will be replaced by the generated list.

```md
### Table of Contents
```

### Table of Contents

This line will be replaced by the generated list.


## Footnotes

Footnotes allow you to add notes and references without cluttering the body of the document. When you create a footnote, a superscript number with a link appears where you added the footnote reference. Readers can click the link to jump to the content of the footnote at the bottom of the page.

To create a footnote reference, add a caret and an identifier inside brackets, e.g. `[^1]` or `[^note]`. Identifiers can be numbers or words, but they can’t contain spaces or tabs. Identifiers only correlate the footnote reference with the footnote itself.

Add the footnote using another caret and number inside brackets with a colon and text `[^1]: My footnote.`. You don’t have to put footnotes at the end of the document. You can put them anywhere except inside other elements like lists, block quotes, and tables.

**Note:** Footnotes can be defined in any order, but will be rearranged and numbered sequentially in the order they were referenced.

```
Here's an example on how to use footnotes[^1].

You can use a one-liner footnote[^2] or a long paragraph[^long-footnote],
just remember to indent the sequential lines so everything is under that long footnote.

[^1]: First footnote example!

[^2]: This is one simple line :blush:

[^long-footnote]: Here’s one with multiple blocks.

    Subsequent paragraphs are indented to show that they belong to the previous footnote.

        { some.code }

    The whole paragraph can be indented, or just the first
    line.  In this way, multi-paragraph footnotes work like
    multi-paragraph list items.

```

Here's an example on how to use footnotes[^1].

You can use a one-liner footnote[^2] or a long paragraph[^long-footnote],
just remember to indent the sequential lines so everything is under that long footnote.

_(Footnotes actually appear at the bottom of the page)_

[^1]: First footnote example!

[^2]: This is one simple line :blush:

[^long-footnote]: Here’s one with multiple blocks.

    Subsequent paragraphs are indented to show that they belong to the previous footnote.

        { some.code }

    The whole paragraph can be indented, or just the first
    line.  In this way, multi-paragraph footnotes work like
    multi-paragraph list items.


## Syntax Highlighting

Syntax highlighting is available within [fenced code blocks](#fenced-code-block) for many popular languages.  Provide the language name after the opening fence, like ` ```md`:

    ```sql
    SELECT * FROM iex.insight
    ```

<br />

    ```python
    # This program prints Hello, world!
    print('Hello, world!')
    ```

Appears as:

```sql
SELECT * FROM iex.insight
```

```python
# This program prints Hello, world!
print('Hello, world!')
```

[Available languages](https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/AVAILABLE_LANGUAGES_PRISM.MD).

## Tables

Basic tables can be created in ASCII-art fashion like this:

```md
| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |
```

| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |

Basically it consists of a single header row, a delimiter row, and zero or more data rows.  The header and delimiter rows must have the same number of cells; data rows can have varying number of cells, with additional cells ignored and empty cells added needed.

The raw Markdown doesn't need to be aligned, but it can help make it more editable.  The outer pipes (`|`) are also optional.

Column alignment can be adjusted by adding a leading or trailing colon (`:`), or both to the heading separator.  That indicates left, right, or center alignment, respectively.

```md
| Syntax      | Description |
|:----------- | -----------:|
| Header      | Title       |
| Paragraph   | Text        |
```

| Syntax      | Description |
|:----------- | -----------:|
| Header      | Title       |
| Paragraph   | Text        |

More complicated table features may require directly using [HTML](#html).
## Task List

Task lists featuring checkboxs can be created by adding `[ ]` or `[x]` to each item in a list.

```md
- [ ] Take out trash
- [ ] Vacuum floor
- [x] Binge-watch The Expanse
```

- [ ] Take out trash
- [ ] Vacuum floor
- [x] Binge-watch The Expanse

## Emojis :tada:

[Unicode Emoji](https://unicode.org/emoji/charts/full-emoji-list.html) characters can be directly inserted into Markdown text. ✅

Alternately, colon-sandwiched emojicodes like `:smile:` :smile: can be used.

```md
:smile:
```

Insight Explorer provides autocomplete for emojicodes within the Insight Editor.  Emojicodes are provided by [node-emoji](https://github.com/omnidan/node-emoji).

## Collapsible Sections

[HTML](#html) can be used to create collapsible sections thanks to the [details](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) element:

```md
<details>
<summary>More Information</summary>

* This content is hidden until the section is toggled open.
* Markdown content can be included
* Don't forget to add extra line breaks to separate HTML and Markdown content

</details>
```

<details>
<summary>More Information</summary>

* This content is hidden until the section is toggled open.
* Markdown content can be included
* Don't forget to add extra line breaks to separate HTML and Markdown content

</details>

## Directives :badge[IEX]{variant=frost fontSize=1.2rem}

Directives are a Markdown extension that provides a consistent way to extend the syntax to new use cases.  This is not part of the [CommonMark](https://commonmark.org/) spec, but it has been extensively discussed [here](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444).

These features are exclusive to Insights Explorer and will not display correctly elsewhere (e.g. GitHub).

### Badges :badge[IEX]{variant=frost fontSize=1.2rem}

Badges are small, inline elements that provide unique styling. They are typically used for labeling, categorizing, providing status, etc.

```md
:badge[New]
:badge[WIP]{colorScheme=red}
:badge[Published]{bg=#5e81ac color=white}
```

:badge[New]
:badge[WIP]{colorScheme=red}
:badge[Published]{bg=#5e81ac color=white}

Badges can be used inline with most content.  If it is too small by default, `fontSize` can be used to increase the size:

```md
:badge[Normal]{colorScheme=green}
:badge[Big]{colorScheme=yellow fontSize=1.2rem}
:badge[Bigger]{colorScheme=red fontSize=1.4rem}
```

:badge[Normal]{colorScheme=green}
:badge[Big]{colorScheme=yellow fontSize=1.2rem}
:badge[Bigger]{colorScheme=red fontSize=1.4rem}

### Tables (Directive) :badge[IEX]{variant=frost fontSize=1.2rem}

The `:::table` directive wraps the basic [table](#table) syntax and provides additional, optional attributes.  By default, it looks the same as the unwrapped version.

For example, you can enable a `border`, configure alternating stripes, increase the cell padding, and make the table full-width:

```md
:::table{border=true colorScheme=pink variant=striped size=lg width=auto}
| Syntax      | Description  | Usage    | Example                                     |
| ----------- | :----------: | -------- | ------------------------------------------- |
| Header      | Title        | Markdown | # This is a title                           |
| Paragraph   | Text         | Markdown | Normal paragraph <br>in two lines           |
| Italic      | Text         | Markdown | Use *asterisks* or _underscores_            |
| Bold        | Text         | Markdown | Use double **asterisks** or __underscores__ |
:::
```

:::table{border=true colorScheme=pink variant=striped size=lg width=auto}
| Syntax      | Description  | Usage    | Example                                     |
| ----------- | :----------: | -------- | ------------------------------------------- |
| Header      | Title        | Markdown | # This is a title                           |
| Paragraph   | Text         | Markdown | Normal paragraph <br>in two lines           |
| Italic      | Text         | Markdown | Use *asterisks* or _underscores_            |
| Bold        | Text         | Markdown | Use double **asterisks** or __underscores__ |
:::

Captions can be added with the `caption` attribute:

```md
:::table{caption="UN 2018 Population Estimates" colorScheme=blue}
| City        | County | Population |
| ----------- | ------ | ---------: |
| Tōkyō       | Japan  | 37,400,068 |
| Delhi       | India  | 28,514,000 |
| Shanghai    | China  | 25,582,000 |
| São Paulo   | Brazil | 21,650,000 |
| Mexico City | Mexico | 21,581,000 |
:::
```

:::table{caption="UN 2018 Population Estimates" colorScheme=blue}
| City        | County | Population |
| ----------- | ------ | ---------: |
| Tōkyō       | Japan  | 37,400,068 |
| Delhi       | India  | 28,514,000 |
| Shanghai    | China  | 25,582,000 |
| São Paulo   | Brazil | 21,650,000 |
| Mexico City | Mexico | 21,581,000 |
:::

Here is an border-less, unstyled table:

```md
:::table{variant=unstyled}
| Feature   | Support |
| :-------- | :------:|
| tables    | ✔       |
| alignment | ✔       |
| borders   | ✔       |
| stripes   | ✔       |
| padding   | ✔       |
:::
```

:::table{variant=unstyled}
| Feature   | Support |
| :-------- | :------:|
| tables    | ✔       |
| alignment | ✔       |
| borders   | ✔       |
| stripes   | ✔       |
| padding   | ✔       |
:::

#### Attributes

* `border`: Adds a border around the table.  Can be set to `true` or `false`
* `width`: Changes the width of the table.  Can be set to `fit-content`, `auto`, or a specific size (eg: 500px, 75%))
* `variant`: Specifies the table style.  Can be set to `simple`, `striped`, `unstyled`
* `size`: Sets the amount of cell spacing.  Can be set to `sm`, `md`, `lg`
* `caption`: Provides a descriptive caption for the table
* `colorScheme`: Changes the color of the stripes. Can be set to `gray`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `cyan`, `purple`, `pink`

The default table attributes are `border=false width=fit-content variant=simple size=sm`.

### Images (Directive) :badge[IEX]{variant=frost fontSize=1.2rem}

The `:image` directive provides additional features beyond what the default image syntax supports.

```md
:image[https://commonmark.org/help/images/favicon.png]{alt="Markdown Logo"}
:image[https://commonmark.org/help/images/favicon.png]{width=50px alt="Markdown Logo"}
```

:image[https://commonmark.org/help/images/favicon.png]{alt="Markdown Logo"}
:image[https://commonmark.org/help/images/favicon.png]{width=50px alt="Markdown Logo"}

```md
Images can be included :image[https://commonmark.org/help/images/favicon.png]{height=1.5rem display=inline alt="Markdown Logo"} inline in text as well
```

Images can be included :image[https://commonmark.org/help/images/favicon.png]{height=1.5rem display=inline alt="Markdown Logo"} inline in text as well

Many attributes are supported, including most CSS properties, including: `alt`, `height`, `width`, `display`, `objectFit`, `objectPosition`, `borderRadius`, etc.

The `objectFit` and `objectPosition` attributes can be used to control how images are cropped to smaller sizes:

```md
<div style="display: flex; justify-content: space-around; max-width: 1000px;">

  :image[https://unsplash.com/photos/5o4WVPa0qGQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8N3x8Y29mZmVlJTIwZmxvd2VyfHwwfHx8fDE2NDEyMzI2NjU&force=true&h=480]{height="300px" objectFit="contain" alt="Photo by Maddi Bazzocco"}

  :image[https://unsplash.com/photos/5o4WVPa0qGQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8N3x8Y29mZmVlJTIwZmxvd2VyfHwwfHx8fDE2NDEyMzI2NjU&force=true&h=480]{height="300px" width="300px" objectFit="cover" objectPosition="center top" alt="Photo by Maddi Bazzocco"}

  :image[https://unsplash.com/photos/5o4WVPa0qGQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8N3x8Y29mZmVlJTIwZmxvd2VyfHwwfHx8fDE2NDEyMzI2NjU&force=true&h=480]{height="300px" width="300px" objectFit="cover" objectPosition="center bottom" alt="Photo by Maddi Bazzocco"}

</div>
```

<div style="display: flex; justify-content: space-around; max-width: 1000px;">

  :image[https://unsplash.com/photos/5o4WVPa0qGQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8N3x8Y29mZmVlJTIwZmxvd2VyfHwwfHx8fDE2NDEyMzI2NjU&force=true&w=300]{height="280px" objectFit="contain" alt="Photo by Maddi Bazzocco"}

  :image[https://unsplash.com/photos/5o4WVPa0qGQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8N3x8Y29mZmVlJTIwZmxvd2VyfHwwfHx8fDE2NDEyMzI2NjU&force=true&w=300]{height="280px" width="280px" objectFit="cover" objectPosition="center top" alt="Photo by Maddi Bazzocco"}

  :image[https://unsplash.com/photos/5o4WVPa0qGQ/download?ixid=MnwxMjA3fDB8MXxzZWFyY2h8N3x8Y29mZmVlJTIwZmxvd2VyfHwwfHx8fDE2NDEyMzI2NjU&force=true&w=300]{height="280px" width="280px" objectFit="cover" objectPosition="center bottom" alt="Photo by Maddi Bazzocco"}

</div>

The `borderRadius` attribute rounds the image corners, all the way up to a circle:

```md
<div style="display: flex; justify-content: space-around; max-width: 1000px;">

:image[https://unsplash.com/photos/eCED0MMzpVI/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjQxMjMzNTQx&force=true&w=640]{borderRadius="1rem" height="280px" width="280px" objectFit="cover" alt="Photo by Rafael Hoyos Weht"}

:image[https://unsplash.com/photos/eCED0MMzpVI/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjQxMjMzNTQx&force=true&w=640]{borderRadius="4rem" height="280px" width="280px" objectFit="cover" alt="Photo by Rafael Hoyos Weht"}

:image[https://unsplash.com/photos/eCED0MMzpVI/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjQxMjMzNTQx&force=true&w=640]{borderRadius="full" height="280px" width="280px" objectFit="cover" alt="Photo by Rafael Hoyos Weht"}

</div>

```

<div style="display: flex; justify-content: space-around; max-width: 1000px;">

:image[https://unsplash.com/photos/eCED0MMzpVI/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjQxMjMzNTQx&force=true&w=640]{borderRadius="1rem" height="280px" width="280px" objectFit="cover" alt="Photo by Rafael Hoyos Weht"}

:image[https://unsplash.com/photos/eCED0MMzpVI/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjQxMjMzNTQx&force=true&w=640]{borderRadius="4rem" height="280px" width="280px" objectFit="cover" alt="Photo by Rafael Hoyos Weht"}

:image[https://unsplash.com/photos/eCED0MMzpVI/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjQxMjMzNTQx&force=true&w=640]{borderRadius="full" height="280px" width="280px" objectFit="cover" alt="Photo by Rafael Hoyos Weht"}

</div>

### Videos :badge[IEX]{variant=frost fontSize=1.2rem}

The `:video` directive lets you embed a video within an Insight.

```md
:video[https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm]{width=100%}
```

:video[https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm]{width=100%}

As with images, relative paths can be used to embed videos which have been uploaded to the Insight.

```md
:video[/screencast.mov]{width=400px loop=true}
```

Many [optional attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attributes) are supported, including `width`, `height`, `autoplay`, `controls`, `loop`, etc.

### Insight :badge[IEX]{variant=frost fontSize=1.2rem}

A Insight reference can be included using the `::insight` directive:

```md
::insight[eg-insights/example-insight]
```

::insight[eg-insights/example-insight]

This requires the target Insight's `fullName` attribute: this is shown in the URL when viewing an Insight.

The presentation can be configured with an optional `layout` attribute:

```md
::insight[eg-insights/example-insight]{layout=compact}
```

::insight[eg-insights/example-insight]{layout=compact}

Possible `layout` values: `default`, `compact`, `square`.

#### Attributes

* `layout`: Changes the display layout.  Can be set to `default`, `compact`, `square`
* `showUpdatedAt`: Includes the update date in certain layouts.  Can be set to `true` or `false`
### Insight Search :badge[IEX]{variant=frost fontSize=1.2rem}

Search results can be included using the `::insights` directive:

```md
::insights[#demo]
```

::insights[#demo]

The search query included in the brackets uses the same syntax as the Search page.  Zero or more matching results may be displayed.

The presentation can be configured with optional attributes:

```md
::insights[markdown #demo]{layout=compact sortField=name sortDirection=asc}
```

::insights[markdown #demo]{layout=compact sortField=name sortDirection=asc}

#### Attributes

* `layout`: Changes the display layout.  Can be set to `default`, `compact`, `square`
* `sortField`: Specifies the sort field.  Can be set to `relevance`, `name`, `relevance`, `createdAt`, `updatedAt`, `publishedDate`
* `sortDirection`: Specifies the sort direction.  Can be set to `asc` or `desc`
* `showUpdatedAt`: Includes the update date in certain layouts.  Can be set to `true` or `false`
* `showScores`: Includes the search relevance score (when sorted by `relevance`).  Can be set to `true` or `false`

### Math (KaTeX) :badge[IEX]{variant=frost fontSize=1.2rem}

Math expressions can be added using [KaTeX](https://katex.org/) notation.

To add an inline equation, use the `:katex[]` directive to wrap the expression e.g. :katex[\int_0^\infty x^2 dx].

```md
:katex[\int_0^\infty x^2 dx]
```

To create an expression block, enclose it in the `:::katex` and `:::` fences:

```md
:::katex
x = \sqrt x / 2
:::
```

:::katex
x = \sqrt x / 2
:::

In order to avoid Markdown parsing of the enclosed content, it can be double-wrapped in code-block fences (` ``` `).
This is important when characters used in the expression have significance in Markdown.

````md
:::katex
```
x = \begin{pmatrix}
  1 & 0 & 0 \\
  0 & 1 & 0 \\
  0 & 0 & 1 \\
\end{pmatrix}
```
:::
````

:::katex
```
x = \begin{pmatrix}
  1 & 0 & 0 \\
  0 & 1 & 0 \\
  0 & 0 & 1 \\
\end{pmatrix}
```
:::

Please refer to KaTeX's [Supported Functions](https://katex.org/docs/supported.html) documentation for additional details on syntax.

### Vega Charts :badge[IEX]{variant=frost fontSize=1.2rem}

[Vega](https://vega.github.io/vega/) is a declarative visualization grammar, and [Vega-Lite](https://vega.github.io/vega-lite/) is a higher-level language which makes it easier to create common visualizations. Charts can be generated on-the-fly from a definition embedded directly in Markdown using the `:::vega` directive. To use, provide the Vega or Vega-Lite chart specification between the `:::` fences.

The actual visualizations are implemented using [Vega-Lite](https://vega.github.io/vega-lite/) and [Vega](https://vega.github.io/vega/).  Either grammar can be used&mdash;Vega-Lite visualizations will be compiled into Vega automatically. Please refer to the [available documentation](https://vega.github.io/vega-lite/docs/) for [examples](https://vega.github.io/vega-lite/examples/) and the complete specification.

> Compared to Vega, Vega-Lite provides a more concise and convenient form
> to author common visualizations. As Vega-Lite can compile its specifications
> to Vega specifications, users may use Vega-Lite as the primary visualization
> tool and, if needed, transition to use the lower-level Vega for advanced use cases.

```md
:::vega
{
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
      {"a": "D", "b": 91}, {"a": "E", "b": 81}, {"a": "F", "b": 53},
      {"a": "G", "b": 19}, {"a": "H", "b": 87}, {"a": "I", "b": 52}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "b", "type": "quantitative"}
  }

}
:::
```

:::vega
{
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
      {"a": "D", "b": 91}, {"a": "E", "b": 81}, {"a": "F", "b": 53},
      {"a": "G", "b": 19}, {"a": "H", "b": 87}, {"a": "I", "b": 52}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "b", "type": "quantitative"}
  }

}
:::

Data can be loaded from files using the `data.url` property. If the value is a relative URL (e.g. `/data.json`), it will be load the corresponding file in the Insight.  Absolute URLs can also be used.

```md
:::vega
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A scatterplot showing horsepower and miles per gallons for various cars.",
  "data": {"url": "https://vega.github.io/editor/data/cars.json"},
  "mark": "point",
  "encoding": {
    "x": {"field": "Horsepower", "type": "quantitative"},
    "y": {"field": "Miles_per_Gallon", "type": "quantitative"}
  }
}
:::
```

:::vega
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A scatterplot showing horsepower and miles per gallons for various cars.",
  "data": {"url": "https://vega.github.io/editor/data/cars.json"},
  "mark": "point",
  "encoding": {
    "x": {"field": "Horsepower", "type": "quantitative"},
    "y": {"field": "Miles_per_Gallon", "type": "quantitative"}
  }
}
:::


By default, the Vega spec will have the `"width": "container"` attribute set.  Height can be set manually in the chart spec if needed.

Additional attributes can be specified between `{}` after the chart type, like this: `:::vega{height=500px}`.

### Xkcd-Style Charts :badge[IEX]{variant=frost fontSize=1.2rem}

xkcd-style charts have a hand-drawn appearance, and their lo-fi nature makes them ideal for presenting rough conclusions.  Charts can be generated on-the-fly from a definition embedded directly in Markdown using the `:::xkcd[]` directive.  To use, provide the chart type as the inline content between square brackets (`[]`), and the chart definition between the `:::` fences.

This is implemented using the [chart.xkcd](https://timqian.com/chart.xkcd/) library.
Please refer to the available documentation for complete details on the syntax and available options.

The following chart types are available: `bar`, `line`, `pie`, `radar`, `xy`.

```md
:::xkcd[line]
{
  title: 'Monthly income of an indie developer',
  xLabel: 'Month',
  yLabel: '$ Dollars',
  data: {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [{
      label: 'Plan',
      data: [30, 70, 200, 600, 500, 800, 1500, 2900, 5000, 8000]
    }, {
      label: 'Reality',
      data: [0, 1, 30, 70, 80, 100, 50, 80, 40, 150]
    }]
  },
  options: {
    yTickCount: 3,
    legendPosition: 2
  }
}
:::
```

:::xkcd[line]
{
  title: 'Monthly income of an indie developer',
  xLabel: 'Month',
  yLabel: '$ Dollars',
  data: {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [{
      label: 'Plan',
      data: [30, 70, 200, 600, 500, 800, 1500, 2900, 5000, 8000]
    }, {
      label: 'Reality',
      data: [0, 1, 30, 70, 80, 100, 50, 80, 40, 150]
    }]
  },
  options: {
    yTickCount: 3,
    legendPosition: 2
  }
}
:::

Additional attributes can be specified between `{}` after the chart type, like this: `:::xkcd[pie]{width=500px}`.
## HTML

HTML can be mixed in with Markdown to provide additional features.

There are some "gotchas" to this due to the way Markdown is parsed. Sometimes Markdown markup can be used within HTML content,
as shown above in [Collapsible Sections](#collapsible-sections), but this is not always true.  When attempting to mix HTML and Markdown, make sure extra line breaks are added between HTML and Markdown content.

```md
<figure style="padding: 1rem; border: 1px solid #999; border-radius: 1rem">
  <figcaption>Listen to the T-Rex:</figcaption>
  <audio
    controls
    src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3">
      Your browser does not support the
      <code>audio</code> element.
  </audio>
</figure>
```

<figure style="padding: 1rem; border: 1px solid #999; border-radius: 1rem">
  <figcaption>Listen to the T-Rex:</figcaption>
  <audio
    controls
    src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3">
      Your browser does not support the
      <code>audio</code> element.
  </audio>
</figure>

The extent of HTML documentation is outside the scope of this document.  Please refer to [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML) for reference.
