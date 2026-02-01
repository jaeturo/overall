(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Dropdown handling (generic for all pages)
    var dropdowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown'));

    function closeAllDropdowns(except) {
      dropdowns.forEach(function(dd) {
        var content = dd.querySelector('.dropdown-content');
        var btn = dd.querySelector('.dropbtn');
        if (!content) return;
        if (except && dd === except) return;
        content.classList.remove('show');
        if (btn) btn.classList.remove('active');
      });
    }

    function adjustDropdownPosition(dropdown) {
      var content = dropdown.querySelector('.dropdown-content');
      if (!content || !content.classList.contains('show')) return;
      var rect = dropdown.getBoundingClientRect();
      var menuWidth = 220; // matches min-width in CSS
      var viewportWidth = window.innerWidth;

      content.classList.remove('right-aligned');
      content.classList.remove('center-aligned');

      if (rect.left + menuWidth > viewportWidth) {
        if (rect.left - menuWidth < 0) {
          content.classList.add('center-aligned');
        } else {
          content.classList.add('right-aligned');
        }
      }
    }

    dropdowns.forEach(function(dd) {
      var btn = dd.querySelector('.dropbtn');
      var content = dd.querySelector('.dropdown-content');
      if (!btn || !content) return;

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var willShow = !content.classList.contains('show');
        closeAllDropdowns();
        if (willShow) {
          content.classList.add('show');
          btn.classList.add('active');
          setTimeout(function() { adjustDropdownPosition(dd); }, 10);
        }
      });
    });

    window.addEventListener('resize', function() {
      dropdowns.forEach(adjustDropdownPosition);
    });

    document.addEventListener('click', function(e) {
      // Close when clicking outside any dropdown
      var clickedInside = dropdowns.some(function(dd) { return dd.contains(e.target); });
      if (!clickedInside) {
        closeAllDropdowns();
      }
    });

    // Mobile hamburger menu
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.getElementById('navMenu');
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      var navLinks = navMenu.querySelectorAll('a');
      Array.prototype.forEach.call(navLinks, function(link) {
        link.addEventListener('click', function() {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });
    }
  });
})();


