# Security

The script runs only in the browser tab your agent marks. It sends nothing over the network, stores nothing, and changes nothing of the page but the one layer it adds. The part to be careful with is the browser tool: a Chrome started with `--remote-debugging-port` can be controlled by any program on your computer, so use a separate profile and close it when you are done.

To report a security problem, use **Report a vulnerability** on the repository's [Security tab](https://github.com/microtaro/show-changes/security). Please don't open a public issue for it.
