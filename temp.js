let img;    // The image to be masked
let maskImg; // The mask image

function processImage() {
    // Load the image and the mask
    let img = loadImage('layerImage.png', () => {
      let maskImg = loadImage('masImage.png', () => {
        createCanvas(640, 480);
        noLoop(); // We only need to draw once
  
        // Apply the mask to the image
        img.mask(maskImg);
  
        // Display the masked image
        image(img, 0, 0);
  
        // Save the result
        save(img, 'maskedImage.png');
      });
    });
  }
  