document.addEventListener('DOMContentLoaded', () => {
  particlesJS("particles-js", {
    "particles": {
      "number": {
        "value": 180,          // muchas partículas estilo PS
        "density": {
          "enable": true,
          "value_area": 1300
        }
      },
      "color": {
        "value": ["#ffffff", "#00ff7f", "#555555"] // blanco, verde, gris oscuro
      },
      "shape": {
        "type": "circle"
      },
      "opacity": {
        "value": 0.35,
        "random": true,
        "anim": {
          "enable": true,
          "speed": 0.2,
          "opacity_min": 0.05,
          "sync": false
        }
      },
      "size": {
        "value": 2.5,
        "random": true,
        "anim": {
          "enable": false
        }
      },
      "line_linked": {
        "enable": true,
        "distance": 110,
        "color": "#cccccc",      // líneas muy suaves tipo PS
        "opacity": 0.12,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 0.8,             // movimiento lento y elegante
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "out",
        "bounce": false
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "grab"
        },
        "onclick": {
          "enable": false
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 140,
          "line_linked": {
            "opacity": 0.25
          }
        }
      }
    },
    "retina_detect": true
  });
});