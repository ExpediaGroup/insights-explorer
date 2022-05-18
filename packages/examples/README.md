# Examples

This package contains example Insights, which can be automatically loaded into Insights Explorer for demonstration or testing purposes.

Several Insights were sourced from [Our World in Data](https://ourworldindata.org/), available under the [Creative Commons BY license](https://creativecommons.org/licenses/by/4.0/).  These Insights are attributed to the respective author, and only contain changes necessary to reproduce them in Markdown format.

Other Insights were [generated using machine learning][lorem-insight].  These Insights are for demonstration purposes only, and do not contain any coherent information.



## Usage

IEX will automatically sync these Insights on startup if the [`EXAMPLES_INIT_ON_STARTUP` environment variable](https://github.com/ExpediaGroup/insights-explorer/wiki/Configuration#examples_init_on_startup) is set to `true`.  This is not recommended for production systems as it may delay startup.

[lorem-insight]: https://github.com/baumandm/lorem-insight
