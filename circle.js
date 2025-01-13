class Circle {
  constructor(x, y, radius, color = 'white') {
    this.x = x; // X-coordinate of the circle's center
    this.y = y; // Y-coordinate of the circle's center
    this.radius = radius; // Circle's radius
    this.color = color; // Circle's color (default: white)
  }

  // Method to set the circle's color
  setColor(newColor) {
    this.color = newColor;
  }
}
