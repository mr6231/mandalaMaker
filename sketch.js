function createButtonRect(x, y, w, h) {
  return {
    rectX: x,
    rectY: y,
    rectW: w,
    rectH: h,
    values: [],
    selectedValue: null,
    pressed: false,

    setValues(values) {
      this.values = values;
      this.selectedValue = this.values[0];  // Set selected value to the first item
    },

    isPointInside: function(px, py) {
      return (
        px >= this.rectX &&
        px <= this.rectX + this.rectW &&
        py >= this.rectY &&
        py <= this.rectY + this.rectH
      );
    },

    draw() {
      // Change color based on whether the button is pressed
      fill(242, 214, 189, 100);
      rect(this.rectX, this.rectY, this.rectW, this.rectH);
      if (this.pressed) {

        if(this.imagePressed){
          image(this.imagePressed, this.rectX,this.rectY, this.rectW, this.rectH);
        }
        else if(this.image){
          image(this.image, this.rectX,this.rectY, this.rectW, this.rectH);
        }
      
      } else {
        if(this.image){
          image(this.image, this.rectX,this.rectY, this.rectW, this.rectH);
        }
      }
    },

    switchSelectedValue() {
      if (this.values.length > 0) {
        let valueInt = this.values.indexOf(this.selectedValue) + 1;
        if (valueInt >= this.values.length) {
          valueInt = 0;  // Wrap around to the first value
        }
        this.selectedValue = this.values[valueInt];
      }
    },

    switchPressed() {
      this.pressed = !this.pressed;  // Toggle pressed state
    },

    setImg(img){
      this.image=img;
    },

    setImgPressed(img){
      this.imagePressed=img;
    }
  };
}

let video;
let handPose;
let touchedL=false;
let touchedR=false;
let drawn=false;
let hands = [];
let listOfCircles = [];

let listOfColorSchemes =[
  ['#173673', '#F2CF1D', '#F29A2E', '#730C02', '#D92525', '#FFFFFF'],
  ['#1B2838', '#43658B', '#A23E48', '#D9A384', '#C0C0C0', '#F4F1DE'],
  ['#403D39', '#6D8B74', '#D9CAB3', '#EDEDED', '#A4A4A4', '#7B5E7B'],
  ['#1D1F21', '#282A36', '#6272A4', '#50FA7B', '#FF79C6', '#BD93F9'],
  ['#2D3142', '#4F5D75', '#BFC0C0', '#EFEDE7', '#A4161A', '#F4A261']
];
let canvasSizeX = 1280;
let canvasSizeY = 720;
let centerX = canvasSizeX/2;
let centerY = canvasSizeY/2;

let centerRadius=300;
let centerR2=600;

baseCirlce = new Circle(centerX, centerY, centerR2);

let angle = 0;
let angleRounded = 0;

let saveNow = false;

let graphics;


let buttonMode = createButtonRect(1000, 10, 100, 100);
let buttonUndo = createButtonRect(1110, 10, 100, 100);
let buttonSave = createButtonRect(10, 10, 100, 100);
let buttonColorScheme = createButtonRect(10, 120, 100, 100);

function popLastCircle(){
  if(listOfCircles.length > 0){
    console.log(listOfCircles);
    listOfCircles.pop();
    console.log(listOfCircles);
  }

}

function saveCircleAsPNG() {
  graphics.clear();
  graphics.noFill();
  graphics.stroke(242, 87, 87, 1);
  graphics.strokeWeight(1);
  graphics.circle(baseCirlce.x,baseCirlce.y,baseCirlce.r);
  for (let i = 0; i < listOfCircles.length; i++) {
    let x = listOfCircles[i];
    graphics.circle(x.x, x.y, x.radius);
  }
  // Get the portion of the canvas that contains the circle
  const circleImage = graphics.get(centerX-centerRadius, centerY-centerRadius, centerRadius*2, centerRadius*2);  // Capture the area where the circle is
  

  generateSVGWithColors(listOfCircles);
  // Save the captured image as a PNG
  save(circleImage, 'mandala.png');
}

function generateSVGWithColors(orgCircles, centerX, centerY, centerRadius) {
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="650" height="650">`;
  const svgFooter = `</svg>`;
  let svgContent = '';
  let circles = [...orgCircles, baseCirlce];

  // Define a simple color palette for the circles and regions
  const colorPalette = listOfColorSchemes[buttonColorScheme.selectedValue]; // Extended palette

  // Define stroke width for the circle
  const strokeWidth = 5;

  // Use Clipper.js to handle the intersection and region filling
  const clipper = new ClipperLib.Clipper();

  // Loop through circles and generate paths for regions
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];
    // Adjust the circle position to match the center of your SVG (with offset)
    const adjustedX = circle.x - 335;
    const adjustedY = circle.y - 55;
    const adjustedRadius = circle.radius / 2;

    // Create path for the circle (use path for clipping)
    const circlePath = new ClipperLib.Path();
    // Convert circle to path (this is a simple approximation using multiple points)
    for (let angle = 0; angle <= 360; angle += 1) {
      const radians = (angle * Math.PI) / 180;
      const x = adjustedX + adjustedRadius * Math.cos(radians);
      const y = adjustedY + adjustedRadius * Math.sin(radians);
      circlePath.push(new ClipperLib.IntPoint(x, y));
    }

    // Perform clipping operations (example of union)
    clipper.AddPath(circlePath, ClipperLib.PT_CLIP, true);
  }

  // Now, let's create regions and assign colors
  const solution = [];
  clipper.Execute(ClipperLib.CT_UNION, solution);

  // Greedy coloring algorithm ensuring symmetric regions have the same color
  const regionColors = [];
  const adjacencyList = [];

  // Helper function to check if two regions overlap or are adjacent
  function areAdjacent(region1, region2) {
    // Use the bounding boxes of the regions for adjacency detection
    const minX1 = Math.min(...region1.map(p => p.X));
    const maxX1 = Math.max(...region1.map(p => p.X));
    const minY1 = Math.min(...region1.map(p => p.Y));
    const maxY1 = Math.max(...region1.map(p => p.Y));

    const minX2 = Math.min(...region2.map(p => p.X));
    const maxX2 = Math.max(...region2.map(p => p.X));
    const minY2 = Math.min(...region2.map(p => p.Y));
    const maxY2 = Math.max(...region2.map(p => p.Y));

    // Check if bounding boxes overlap
    return !(maxX1 < minX2 || maxX2 < minX1 || maxY1 < minY2 || maxY2 < minY1);
  }

  // Initialize adjacency list for each region
  for (let i = 0; i < solution.length; i++) {
    adjacencyList[i] = [];  // Ensure each region has an initialized array for neighbors
  }

  // Create adjacency list
  for (let i = 0; i < solution.length; i++) {
    for (let j = i + 1; j < solution.length; j++) {
      if (areAdjacent(solution[i], solution[j])) {
        adjacencyList[i].push(j);
        adjacencyList[j].push(i);
      }
    }
  }

  // Color regions using greedy coloring ensuring symmetry
  for (let i = 0; i < solution.length; i++) {
    let colorAssigned = false;

    // Try to assign the first available color that doesn't conflict with adjacent regions
    for (let colorIndex = 0; colorIndex < colorPalette.length; colorIndex++) {
      const color = colorPalette[colorIndex];
      let conflict = false;

      // Check if any adjacent region already has the same color or mirrored region has the same color
      for (let neighborIndex of adjacencyList[i]) {
        if (regionColors[neighborIndex] === color || regionColors[mirrorIndex(neighborIndex, solution)] === color) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        regionColors[i] = color;
        colorAssigned = true;
        break;
      }
    }

    // If no color was assigned (i.e., all colors conflict), you could extend the palette or handle that case.
    if (!colorAssigned) {
      regionColors[i] = colorPalette[colorPalette.length - 1]; // Fallback color
    }
  }

  // Create SVG paths for each region
  solution.forEach((region, index) => {
    const color = regionColors[index];
    const pathData = region.map(p => `${p.X},${p.Y}`).join(' ');

    svgContent += `<path d="M ${pathData} Z" fill="${color}" stroke="black" stroke-width="${strokeWidth}" />\n`;
  });

  // Loop through each circle and generate an SVG <circle> element
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];
    // Adjust the circle position for the center of the canvas
    svgContent += `<circle cx="${circle.x - 335}" cy="${circle.y - 55}" r="${circle.radius / 2}" fill="none" stroke="black" stroke-width="${strokeWidth}"/>\n`;
  }

  // Combine everything into one SVG string
  const svgString = svgHeader + svgContent + svgFooter;

  // Create a Blob from the SVG string and save it as a file
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'circles_with_colored_regions.svg'; // Set the default file name
  document.body.appendChild(a); // Append to the body to trigger click
  a.click(); // Trigger the download
  document.body.removeChild(a); // Remove the anchor element
}

function mirrorIndex(index, solution) {
  const x = Math.abs(solution.length - 1 - index);
  return x;
}

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {

  imgReload = loadImage('svg/reload.png');
  imgConfirm = loadImage('svg/confirm.png');
  imgColor = loadImage('svg/color.png');
  imgSave = loadImage('svg/save.png');
  imgVenn = loadImage('svg/venn.png');
  imgUndo = loadImage('svg/undo.png');

  imgColorP = loadImage('svg/color-pressed.png');
  imgSaveP = loadImage('svg/save-pressed.png');
  imgVennP = loadImage('svg/venn-pressed.png');
  imgUndoP = loadImage('svg/undo-pressed.png');

  buttonMode.setImg(imgVenn);
  buttonUndo.setImg(imgUndo);
  buttonSave.setImg(imgSave);
  buttonColorScheme.setImg(imgColor);

  buttonMode.setImgPressed(imgVennP);
  buttonUndo.setImgPressed(imgUndoP);
  buttonSave.setImgPressed(imgSaveP);
  buttonColorScheme.setImgPressed(imgColorP);

  buttonMode.setValues([0,1]);
  buttonUndo.setValues([0,1]);
  buttonSave.setValues([0,1]);
  buttonColorScheme.setValues([0,1,2,3,4]);

  // Set canvas to 1280x720 (720p resolution)
  createCanvas(canvasSizeX, canvasSizeY);
  // Set video capture to 1280x720 (720p resolution)
  video = createCapture(VIDEO, { flipped: true });
  video.size(canvasSizeX, canvasSizeY);
  video.hide();

  // Start hand pose detection
  handPose.detectStart(video, gotHands);

  graphics = createGraphics(canvasSizeX, canvasSizeY);
}

function drawCircles() {
  noFill();
  stroke(242, 87, 87);
  strokeWeight(5);
  for (let i = 0; i < listOfCircles.length; i++) {
    let x = listOfCircles[i];
    circle(x.x, x.y, x.radius);
  }
}

function drawUI(){
  noStroke();
  buttonMode.draw();
  buttonSave.draw();
  buttonUndo.draw();
  buttonColorScheme.draw();
  let squareSize = 50
  let x = 10;
  let y = 230;

  for (let i = 0; i < 6; i++) {
    fill(listOfColorSchemes[buttonColorScheme.selectedValue][i]);
    rect(x, y, squareSize, squareSize);
    y += squareSize + 10;
  }

}

function draw() {
  // Draw the video feed
  image(video, 0, 0, width, height);
  fill(242, 214, 189);
  circle(baseCirlce.x, baseCirlce.y, baseCirlce.radius);
  drawUI();

  // If hands are detected, process them
  if (hands.length > 0) {
    let handIndex=0;
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Draw hand
          if (hand.handedness === "Left") {
            fill(114, 206, 242);
          } else {
            fill(166, 60, 60);
          }
          noStroke();
          circle(keypoint.x, keypoint.y, 16);
        }
        // Detect if thumb and index finger are touching
        let thumb = hand.keypoints[4]; // Thumb tip
        let indexFinger = hand.keypoints[8]; // Index fingertip

        let distance = dist(thumb.x, thumb.y, indexFinger.x, indexFinger.y);

        if (distance < 30) { // Adjust threshold as needed
          let midpointX = (thumb.x + indexFinger.x) / 2;
          let midpointY = (thumb.y + indexFinger.y) / 2;
          fill(242, 131, 121);
          if(hand.handedness=="Left"){
            touchedL = true;
            noStroke();
            circle(midpointX, midpointY, 50); 
            image(imgReload, midpointX-20, midpointY-20, 40, 40);
          }
          else{
            touchedR = true;
            noStroke();
            circle(midpointX, midpointY, 50);
            image(imgConfirm, midpointX-20, midpointY-20, 40, 40);
          }
        }
        else{
          if(hand.handedness=="Left"){
            touchedL = false;
          }
          else{
            touchedR = false;
          }
        }
        if(hand.handedness=="Right"){
          if (buttonMode.isPointInside(indexFinger.x,indexFinger.y)) {
            if(!buttonMode.pressed){
                buttonMode.switchPressed();
                buttonMode.switchSelectedValue();
            }
          }
          else if (buttonUndo.isPointInside(indexFinger.x,indexFinger.y)) {
            if(!buttonUndo.pressed){
              buttonUndo.switchPressed();
              buttonUndo.switchSelectedValue();
              popLastCircle();
            }
          }
          else{
            if(buttonMode.pressed){
              buttonMode.switchPressed();
            }
            if(buttonUndo.pressed){
              buttonUndo.switchPressed();
              buttonUndo.switchSelectedValue();
            }
          }
        }

        if(hand.handedness=="Left"){
          if (buttonSave.isPointInside(indexFinger.x,indexFinger.y)) {
            if(!buttonSave.pressed){
              buttonSave.switchPressed();
              buttonSave.switchSelectedValue();
              saveNow = true;
            }
          }
          else if (buttonColorScheme.isPointInside(indexFinger.x,indexFinger.y)) {
            if(!buttonColorScheme.pressed){
              buttonColorScheme.switchPressed();
              buttonColorScheme.switchSelectedValue();
            }
          }
          else{
            if(buttonSave.pressed){
              buttonSave.switchPressed();
              buttonSave.switchSelectedValue();
            }
            if(buttonColorScheme.pressed){
              buttonColorScheme.switchPressed();
            }
          }
        }
      }
      handIndex++;
    }

    // If two hands are detected, calculate distance between index fingers
    if (hands.length >= 2) {
      let hand1;
      let hand2;
      if(hands[0].handedness == "Right"){
        hand1 = hands[0];
        hand2 = hands[1];
      }
      else{
        hand1 = hands[1];
        hand2 = hands[0];
      }

      let keypoint1 = hand1.keypoints[9];
      let keypoint2 = hand2.keypoints[9];

      // Calculate distance
      let distanceCRH = dist(centerX, centerY, keypoint1.x, keypoint1.y);
      let distanceCLH = dist(centerX, centerY, keypoint2.x, keypoint2.y);
      /*
      // Draw a line between keypoints
      stroke(0, 255, 0);
      line(centerX, centerY, keypoint2.x, keypoint2.y);
      line(keypoint1.x, keypoint1.y, centerX, centerY);*/

      //draw what you are drawing
      stroke(54, 98, 115);
      noFill();
      let radius = Math.round(distanceCRH / 15) * 15;
      if (radius > 600){
        radius = 600;
      } 

      if(touchedL){
        angle = angle+1;
        angleRounded = Math.round(angle / 10) * 10;
      }


      switch(buttonMode.selectedValue){
        case 0:
          circle(640, 360, radius);
          if(touchedR && !drawn){
            x=new Circle(640, 360, radius)
            listOfCircles.push(x);
            drawn=true;
          }
          break;
          case 1:

            // Angles in radians
            let angleA = radians(270+angleRounded); // Point A
            let angleB = radians(30+angleRounded);  // Point B
            let angleC = radians(150+angleRounded); // Point C

            distanceFromCenter = Math.round((centerRadius - distanceCLH) / 15) * 15;

            // Point A
            let ax = centerX + distanceFromCenter * cos(angleA);
            let ay = centerY + distanceFromCenter * sin(angleA);
          
            // Point B
            let bx = centerX + distanceFromCenter * cos(angleB);
            let by = centerY + distanceFromCenter * sin(angleB);
          
            // Point C
            let cx = centerX + distanceFromCenter * cos(angleC);
            let cy = centerY + distanceFromCenter * sin(angleC);
          
            // Draw the points
            noFill();
            circle(ax, ay, radius);
            circle(bx, by, radius);
            circle(cx, cy, radius);
            if(touchedR && !drawn){
              x=new Circle(ax, ay, radius)
              y=new Circle(bx, by, radius)
              z=new Circle(cx, cy, radius)
              listOfCircles.push(x);
              listOfCircles.push(y);
              listOfCircles.push(z);
              drawn=true;
            }
            break;
      }
    }
  }
  else{
    drawn=false;
  }
  drawCircles();
  if(saveNow){
    generateSVGWithColors(listOfCircles);
    saveNow=false;
  }
}