document.addEventListener(
    "DOMContentLoaded",
    function () {

        const menuToggle =
            document.querySelector(
                ".menu-toggle"
            );

        const siteNav =
            document.querySelector(
                ".site-nav"
            );

        const navLinks =
            document.querySelectorAll(
                ".site-nav a"
            );


        if (
            !menuToggle ||
            !siteNav
        ) {

            return;

        }


        menuToggle.addEventListener(
            "click",
            function () {

                siteNav.classList.toggle(
                    "open"
                );


                const isOpen =
                    siteNav.classList.contains(
                        "open"
                    );


                menuToggle.setAttribute(
                    "aria-expanded",
                    isOpen
                );


                menuToggle.setAttribute(
                    "aria-label",
                    isOpen
                        ? "Close menu"
                        : "Open menu"
                );

            }
        );


        navLinks.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        siteNav.classList.remove(
                            "open"
                        );


                        menuToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        menuToggle.setAttribute(
                            "aria-label",
                            "Open menu"
                        );

                    }
                );

            }
        );

    }
);


/* =====================================================
   VISUALISATION / ABOUT
===================================================== */

const visualisationFrame =
    document.querySelector(
        ".visualisation-frame iframe"
    );


/*
   Keep the mobile-layout definition here as well.

   This must match the definition used inside
   the visualisation iframe.
*/

function isMobileLayout() {

    return (

        window.innerWidth <= 700 ||

        (
            window.matchMedia(
                "(orientation: landscape) and (max-height: 700px)"
            ).matches
        )

    );

}


if (visualisationFrame) {


    /* =================================================
       RECEIVE MESSAGES FROM VISUALISATION
    ================================================= */

    window.addEventListener(
        "message",
        function (event) {


            /*
               Only respond to messages coming
               from our visualization iframe.
            */

            if (
                event.source !==
                visualisationFrame.contentWindow
            ) {

                return;

            }


            /* -----------------------------------------
               OPEN ABOUT
            ----------------------------------------- */

            if (
                event.data?.type ===
                "bookshelf-about-open"
            ) {

                if (
                    isMobileLayout()
                ) {

                    visualisationFrame.classList.add(
                        "about-fullscreen"
                    );

                    document.body.classList.add(
                        "about-open"
                    );

                }

            }


            /* -----------------------------------------
               CLOSE ABOUT
            ----------------------------------------- */

            if (
                event.data?.type ===
                "bookshelf-about-close"
            ) {

                visualisationFrame.classList.remove(
                    "about-fullscreen"
                );

                document.body.classList.remove(
                    "about-open"
                );

            }

        }
    );


    /* =================================================
       RESIZE
    ================================================= */

    window.addEventListener(
        "resize",
        function () {


            /*
               If the browser changes from mobile
               to desktop while About is open,
               restore the normal iframe.
            */

            if (
                !isMobileLayout()
            ) {

                visualisationFrame.classList.remove(
                    "about-fullscreen"
                );

                document.body.classList.remove(
                    "about-open"
                );

            }

        }
    );

}