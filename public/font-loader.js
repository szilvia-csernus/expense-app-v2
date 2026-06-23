if ("fonts" in document) {
  Promise.all([
    document.fonts.load('500 1em "Josefin Sans"'),
    document.fonts.load("300 1em Quicksand"),
  ]).then(() => {
    document.documentElement.classList.remove("font-loading");
  });
}
