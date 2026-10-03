document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const siteNav = document.querySelector(".site-nav");
    const navLinks = document.querySelectorAll(".site-nav a");

    if (!menuToggle || !siteNav) return;

    menuToggle.addEventListener("click", function () {
        siteNav.classList.toggle("open");

        const isOpen = siteNav.classList.contains("open");

        menuToggle.setAttribute("aria-expanded", isOpen);

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu"
        );
    });

    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            siteNav.classList.remove("open");

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open menu");
        });
    });
});

/* ============================================================
   VISUALISATION FULL VIEW
============================================================ */

const visualisation =
    document.querySelector(".visualisation");

const visualisationIframe =
    visualisation?.querySelector("iframe");


if (visualisation && visualisationIframe) {

    window.addEventListener(
        "message",
        function (event) {

            /*
               Only accept messages from this page.
            */

            if (
                event.origin !== window.location.origin
            ) {
                return;
            }


            /*
               Only accept messages from
               our visualisation iframe.
            */

            if (
                event.source !==
                visualisationIframe.contentWindow
            ) {
                return;
            }


            if (
                !event.data ||
                event.data.type !==
                "visualisation-full-view"
            ) {
                return;
            }


            /* ENTER */

            if (
                event.data.action === "enter"
            ) {

                visualisation.classList.add(
                    "full-view"
                );

                document.body.classList.add(
                    "visualisation-full-view"
                );

            }


            /* EXIT */

            if (
                event.data.action === "exit"
            ) {

                visualisation.classList.remove(
                    "full-view"
                );

                document.body.classList.remove(
                    "visualisation-full-view"
                );

            }

        }
    );

}