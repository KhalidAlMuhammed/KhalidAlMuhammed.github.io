/**
  * Dark Light Mode
  * Header Connect
  * Loadmore Item
  * headerFixed
  * retinaLogo
  * ajaxContactForm
  * mobileNav
  * ajaxSubscribe
  * alertBox
  * loadmore
*/

; (function ($) {
    "use strict";

    //Scroll back to top
    function handlePreloader() {
        if ($(".preloader").length) {
            $("body").addClass("page-loaded");
            $(".preloader").delay(400).fadeOut(0);
        }
    }


    var themesflatTheme = {

        // Main init function
        init: function () {
            this.config();
            this.events();
        },

        // Define vars for caching
        config: function () {
            this.config = {
                $window: $(window),
                $document: $(document),
            };
        },

        // Events
        events: function () {
            var self = this;

            // Run on document ready
            self.config.$document.on('ready', function () {


                // Retina Logos
                self.retinaLogo();


            });

            // Run on Window Load
            self.config.$window.on('load', function () {

            });
        },


        // Retina Logos
        retinaLogo: function () {
            var retina = window.devicePixelRatio > 1 ? true : false;
            var $logo = $('#site-logo img');
            var $logo2 = $('#logo-footer img');
            var $logo_retina = $logo.data('retina');

            if (retina && $logo_retina) {
                $logo.attr({
                    src: $logo.data('retina'),
                    width: $logo.data('width'),
                    height: $logo.data('height')
                });
            }
            if (retina && $logo_retina) {
                $logo2.attr({
                    src: $logo.data('retina'),
                    width: $logo.data('width'),
                    height: $logo.data('height')
                });
            }
        },

    }; // end themesflatTheme

    // Start things up
    themesflatTheme.init();


    var removePreloader = function () {
        $(window).on('load', function () {
            $(".preloader").css("opacity", 0);
            setTimeout(function () {
                $(".preloader").hide();
            }, 1000);
        });
    };

    // Header Fixed
    var headerFixed = function () {
        if ($('body').hasClass('header-fixed')) {
            var nav = $('#header_main');
            if (nav.length) {
                var offsetTop = nav.offset().top,
                    headerHeight = nav.height(),
                    injectSpace = $('<div />', {
                        height: headerHeight
                    }).insertAfter(nav);
                $(window).on('load scroll', function () {
                    if ($(window).scrollTop() > 200) {
                        nav.addClass('is-fixed');
                        injectSpace.show();
                    } else {
                        nav.removeClass('is-fixed');
                        injectSpace.hide();
                    }

                    if ($(window).scrollTop() > 400) {
                        nav.addClass('is-small');
                    } else {
                        nav.removeClass('is-small');
                    }
                })
            }
        }
    };
    var goTop = function () {
        $(window).scroll(function () {
            if ($(this).scrollTop() > 800) {
                $('#scroll-top').addClass('show');
            } else {
                $('#scroll-top').removeClass('show');
            }
        });

        $('#scroll-top').on('click', function () {
            $("html, body").animate({ scrollTop: 0 }, 200, 'easeInOutExpo');
            return false;
        });
    };

    // Mobile Navigation
    var mobileNav = function () {
        var mobile = window.matchMedia("(max-width: 1024px)");
        var wrapMenu = $(".header__right");
        var navExtw = $(".nav-extend.active");
        var navExt = $(".nav-extend.active").children();

        responsivemenu(mobile);

        mobile.addListener(responsivemenu);

        function responsivemenu(mobile) {
            if (mobile.matches) {
                $("#main-nav")
                    .attr("id", "main-nav-mobi")
                    .appendTo("#header_main")
                    .hide()
                    .children(".menu")
                    .append(navExt)
                    .find("li:has(ul)")
                    .children("ul")
                    .removeAttr("style")
                    .hide()
                    .before('<span class="arrow"></span>');
            } else {
                $("#main-nav-mobi")
                    .attr("id", "main-nav")
                    .removeAttr("style")
                    .prependTo(wrapMenu)
                    .find(".ext")
                    .appendTo(navExtw)
                    .parent()
                    .siblings("#main-nav")
                    .find(".sub-menu")
                    .removeAttr("style")
                    .prev()
                    .remove();

                $(".mobile-button").removeClass("active");
                $(".mobile-button-style2").removeClass("active");
                $(".sub-menu").css({ display: "block" });
            }
        }
        $(document).on("click", ".mobile-button", function () {
            $(this).toggleClass("active");
            $("#main-nav-mobi").slideToggle();
        });
        $(document).on("click", ".mobile-button-style2", function () {
            $(this).toggleClass("active");
            $("#main-nav-mobi").slideToggle();
        });
        $(document).on("click", "#main-nav-mobi .arrow", function () {
            $(this).toggleClass("active").next().slideToggle();
        });
    };

    var alertBox = function () {
        $(document).on('click', '.close', function (e) {
            $(this).closest('.flat-alert').remove();
            e.preventDefault();
        })

    };

    var flatAccordion = function () {
        var args = { duration: 600 };
        $('.flat-toggle .toggle-title.active').siblings('.toggle-content').show();

        $('.flat-toggle.enable .toggle-title').on('click', function () {
            $(this).closest('.flat-toggle').find('.toggle-content').slideToggle(args);
            $(this).toggleClass('active');
        }); // toggle 

        $('.flat-accordion .toggle-title').on('click', function () {
            $('.flat-accordion .flat-toggle').removeClass('active');
            $(this).closest('.flat-toggle').toggleClass('active');

            if (!$(this).is('.active')) {
                $(this).closest('.flat-accordion').find('.toggle-title.active').toggleClass('active').next().slideToggle(args);
                $(this).toggleClass('active');
                $(this).next().slideToggle(args);
            } else {
                $(this).toggleClass('active');
                $(this).next().slideToggle(args);
                $('.flat-accordion .flat-toggle').removeClass('active');
            }
        }); // accordion
    };

    var flatCounter = function () {
        if ($().countTo) {
            $('.themesflat-counter').on('on-appear', function () {
                $(this).find('.number').each(function () {
                    var to = $(this).data('to'),
                        speed = $(this).data('speed');

                    $(this).countTo({
                        to: to,
                        speed: speed
                    });
                });
            });
        }
    };

    var flattabs = function () {
        $('.flat-tabs').each(function () {
            $(this).find('.content-tab').children().hide();
            $(this).find('.content-tab').children().first().show();
            $(this).find('.menu-tab').children('li').on('click', function () {
                var liActive = $(this).index();
                var contentActive = $(this).siblings().removeClass('active').parents('.flat-tabs').find('.content-tab').children().eq(liActive);
                contentActive.addClass('active').fadeIn("slow");
                contentActive.siblings().removeClass('active');
                $(this).addClass('active').parents('.flat-tabs').find('.content-tab').children().eq(liActive).siblings().hide();
            });
        });

    };




    var popupVideo = function () {
        if ($().magnificPopup) {
            $(".popup-youtube").magnificPopup({
                type: "iframe",
                mainClass: "mfp-fade",
                removalDelay: 160,
                preloader: false,
                fixedContentPos: false,
            });
        }
    };

    $(".piechart-holder").appear(function () {
        $(this).find(".chart").each(function () {
            $(".chart").easyPieChart({
                barColor: "#0055FF",
                trackColor: "#10151A",
                scaleColor: "#fff",
                size: "170",
                lineWidth: "20",
                lineCap: "butt",
                onStep: function (a, b, c) {
                    $(this.el).find(".percent").text(Math.round(c));
                }
            });
        });
    });

    $(".piechart-holder").appear(function () {
        $(this).find(".chart-active").each(function () {
            $(".chart-active").easyPieChart({
                barColor: "#fff",
                trackColor: "#10151A",
                scaleColor: "#fff",
                size: "170",
                lineWidth: "20",
                lineCap: "butt",
                onStep: function (a, b, c) {
                    $(this.el).find(".percent").text(Math.round(c));
                }
            });
        });
    });

    var arlo_tm_animate_text = function () {
        var animateSpan = jQuery(".arlo_tm_animation_text_word");
        animateSpan.typed({ strings: ["Khalid Al Muhammed"], loop: false, startDelay: 1e3, backDelay: 2e3 });
    }

    var arlo_tm_about_animation = function () {
        if ($(".parallax").length > 0) {
            var scene = $(".parallax").get(0);
            var parallax = new Parallax(scene, {
                relativeInput: true,
                onReady: function () {
                    console.log("ready!");
                },
            });
        }
    }

    var dropdown = function (id) {
        var obj = $(id + '.dropdown');
        var btn = obj.find('.btn-selector');
        var dd = obj.find('ul');
        var opt = dd.find('li');
        dd.hide();
        obj.on("mouseenter", function () {
            dd.show();
            dd.addClass('show');
            $(this).css("z-index", 1000);
        }).on("mouseleave", function () {
            dd.hide();
            $(this).css("z-index", "auto")
            dd.removeClass('show');
        })

        opt.on("click", function () {
            dd.hide();
            var txt = $(this).text();
            opt.removeClass("active");
            $(this).addClass("active");
            btn.text(txt);
        });
    }

    var no_link = function () {
        $('a.nolink').on('click', function (e) {
            e.preventDefault();
        });
        $('.icon_menu .icon a').on('click', function (e) {
            e.preventDefault();
        });
    }
    var wow = new WOW({
        animateClass: 'animated',
        offset: 100
    });
    wow.init();

    $(window).on("load", function () {


        /* ===============================  SPLITTING TEXT  =============================== */

        Splitting();


        /* ===============================  SPLITTING  =============================== */

        var imageUp = document.getElementsByClassName('thumparallax');
        new simpleParallax(imageUp, {
            delay: 1
        });

        var imageDown = document.getElementsByClassName('thumparallax-down');
        new simpleParallax(imageDown, {
            orientation: 'down',
            delay: 1
        });



        /* ===============================  contact validator  =============================== */

    });




    // Dom Ready
    $(function () {
        AOS.init();
        removePreloader();
        handlePreloader();
        headerFixed();
        goTop();
        mobileNav();
        alertBox();
        flatAccordion();
        flatCounter();
        flattabs();
        popupVideo();
        no_link();
        dropdown('#category');
        dropdown('#item');
        dropdown('#buy');
        arlo_tm_animate_text();
        arlo_tm_about_animation();

    });


})(jQuery);