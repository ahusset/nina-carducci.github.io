(function ($) {
  $.fn.mauGallery = function (options) {
    var options = $.extend($.fn.mauGallery.defaults, options);
    var tagsCollection = [];
    return this.each(function () {
      // Crée un wrapper pour les lignes d'items de la galerie, ajoutant une structure de grille.
      $.fn.mauGallery.methods.createRowWrapper($(this));

      // Condition pour vérifier si la lightbox doit être activée, puis la crée.
      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox(
            $(this),
            options.lightboxId,
            options.navigation
        );
      }

      // Ajout des écouteurs pour les interactions avec les items de la galerie.
      $.fn.mauGallery.listeners(options);

      $(this)
          .children(".gallery-item")
          .each(function (index) {
            // Rend chaque image responsive.
            $.fn.mauGallery.methods.responsiveImageItem($(this));
            // Déplace l'item dans le wrapper de la ligne.
            $.fn.mauGallery.methods.moveItemInRowWrapper($(this));
            // Enveloppe l'item dans une colonne en fonction des paramètres de colonnes spécifiés.
            $.fn.mauGallery.methods.wrapItemInColumn($(this), options.columns);

            var theTag = $(this).data("gallery-tag");
            if (
                options.showTags &&
                theTag !== undefined &&
                tagsCollection.indexOf(theTag) === -1
            ) {
              tagsCollection.push(theTag);
            }
          });

      // Affiche les tags si l'option est activée.
      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags(
            $(this),
            options.tagsPosition,
            tagsCollection
        );
      }

      // Effet de fondu pour l'apparition de la galerie.
      $(this).fadeIn(500);
    });
  };

  // Définition des options par défaut de la galerie.
  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true,
  };

  // Gestion des interactions de l'utilisateur avec la galerie.
  $.fn.mauGallery.listeners = function (options) {
    // Gestionnaire pour l'ouverture de la lightbox lors du clic sur une image.
    $(".gallery-item").on("click", function () {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      } else {
        return;
      }
    });

    // Gestionnaire pour l'ouverture de la lightbox via la touche "Entrée" pour l'accessibilité.
    $(".gallery-item").on("keypress", function (e) {
      if (e.keyCode === 13) {
        if (options.lightBox && $(this).prop("tagName") === "IMG") {
          $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
        } else {
          return;
        }
      }
    });

    // Navigation et filtrage par tags.
    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () =>
        $.fn.mauGallery.methods.prevImage(options.lightboxId)
    );
    $(".gallery").on("keypress", ".mg-prev", function (e) {
      if (e.keyCode === 13) {
        $.fn.mauGallery.methods.prevImage(options.lightboxId);
      }
    });
    $(".gallery").on("click", ".mg-next", () =>
        $.fn.mauGallery.methods.nextImage(options.lightboxId)
    );
    $(".gallery").on("keypress", ".mg-next", function (e) {
      if (e.keyCode === 13) {
        $.fn.mauGallery.methods.nextImage(options.lightboxId);
      }
    });
  };

  // Méthodes de manipulation et d'affichage des éléments de la galerie.
  $.fn.mauGallery.methods = {
    // Crée un wrapper de rangée si non présent.
    createRowWrapper: function (element) {
      if (!element.children().first().hasClass("row")) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },
    // Enveloppe l'item dans une colonne, adaptée aux différentes tailles d'écran si spécifié.
    wrapItemInColumn: function (element, columns) {
      // Gestion dynamique de la taille des colonnes basée sur les breakpoints Bootstrap.
      if (columns.constructor === Number) {
        element.wrap(
            `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (columns.constructor === Object) {
        var columnClasses = "";
        if (columns.xs) {
          columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        }
        if (columns.sm) {
          columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        }
        if (columns.md) {
          columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        }
        if (columns.lg) {
          columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        }
        if (columns.xl) {
          columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        }
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
            `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },
    // Déplace l'élément dans le wrapper de rangée pour une meilleure structuration de la grille.
    moveItemInRowWrapper: function (element) {
      element.appendTo(".gallery-items-row");
    },
    // Rend chaque image responsive.
    responsiveImageItem: function (element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    // Ouvre la lightbox avec l'image sélectionnée.
    openLightBox: function (element, lightboxId) {
      $(`#${lightboxId}`)
          .find(".lightboxImage")
          .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },
    // Navigation précédente dans la lightbox.
    prevImage: function (lightboxId) {
      let activeImage = null;
      $("img.gallery-item").each(function () {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      let activeTag = $(".tags-bar button.active-tag").data("images-toggle");
      let imagesCollection = [];
      if (activeTag === "all") {
        $(".item-column").each(function () {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function () {
          if ($(this).children("img").data("gallery-tag") === activeTag) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      let index = 0,
          next = null;

      $(imagesCollection).each(function (i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i;
        }
      });
      next =
          imagesCollection[index - 1] ||
          imagesCollection[imagesCollection.length - 1];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },
    // Navigation suivante dans la lightbox.
    nextImage: function (lightboxId) {
      let activeImage = null;
      $("img.gallery-item").each(function () {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      let activeTag = $(".tags-bar button.active-tag").data("images-toggle");
      let imagesCollection = [];
      if (activeTag === "all") {
        $(".item-column").each(function () {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column"). each(function () {
          if ($(this).children("img").data("gallery-tag") === activeTag) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      let index = 0,
          next = null;

      $(imagesCollection).each(function (i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i;
        }
      });
      next = imagesCollection[index + 1] || imagesCollection[0];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },
    // Crée une lightbox dynamique pour les images, intégrant des boutons de navigation si spécifié.
    createLightBox: function (gallery, lightboxId, navigation) {
      gallery.append(`<div class="modal fade" id="${lightboxId ? lightboxId : "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-body">
                                    ${
          navigation
              ? '<div role="button" class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;" tabindex="0"><</div>'
              : '<span style="display:none;" />'
      }
                                    <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                                    ${
          navigation
              ? '<div role="button" class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}" tabindex="0">></div>'
              : '<span style="display:none;" />'
      }
                                </div>
                            </div>
                        </div>
                    </div>`);
    },
    // Affiche les tags des items de la galerie, permettant un filtrage interactif basé sur les tags.
    showItemTags: function (gallery, position, tags) {
      var tagItems =
          '<li class="nav-item"><button class="nav-link active active-tag"  data-images-toggle="all">Tous</button></li>';
      $.each(tags, function (index, value) {
        tagItems += `<li class="nav-item">
                        <button class="nav-link"  data-images-toggle="${value}">${value}</button></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },
    // Filtre les items de la galerie en fonction du tag sélectionné.
    filterByTag: function () {
      if ($(this).hasClass("active-tag")) {
        return;
      }
      $(".active-tag").removeClass("active active-tag");
      $(this).addClass("active active-tag");

      var tag = $(this).data("images-toggle");

      $(".gallery-item").each(function () {
        $(this).parents(".item-column").hide();
        if (tag === "all") {
          $(this).parents(".item-column").show(300);
        } else if ($(this).data("gallery-tag") === tag) {
          $(this).parents(".item-column").show(300);
        }
      });
    },
  };
})(jQuery);
