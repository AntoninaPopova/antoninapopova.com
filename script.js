document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.querySelector(".menu-toggle");
    const siteNav = document.querySelector(".site-nav");
    const navLinks = document.querySelectorAll(".site-nav a");

    if (!menuToggle || !siteNav) {
        return;
    }

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