const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,500;1,500&family=Quicksand:wght@300..700&display=swap";
document.head.appendChild(link);

if ("fonts" in document) {
  Promise.all([
    document.fonts.load('500 1em "Josefin Sans"'),
    document.fonts.load("300 1em Quicksand"),
  ]).then(() => {
    document.documentElement.classList.remove("font-loading");
  });
}
