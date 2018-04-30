let svg = d3.select('body').append('svg').attr('width', '600')
	.attr('height', '600');

let points = [{
	x: 20,
  y: 70
}, {
	x: 120,
  y: 100
}, {
	x: 140,
  y: 150
}, {
	x: 250,
  y: 100
}, {
	x: 350,
  y: 150
}, {
	x: 370,
  y: 200
}];

let shouldCheckBothDirection = (prevPoint, nextPoint, currentPoint, currPos) => {
    let checkBothDirection;
    if (Math.abs(prevPoint.x - currPos.x) === 0 && Math.abs(prevPoint.y - currPos.y) === 0) {
        checkBothDirection = true;
    }
    else if (Math.abs(nextPoint.x - currPos.x) === 0 && Math.abs(nextPoint.y - currPos.y) === 0) {
        checkBothDirection = true;
    }

    else if (Math.abs(currentPoint.x - currPos.x) === 0 && Math.abs(currentPoint.y - currPos.y) === 0) {
        checkBothDirection = true;
    }
    return checkBothDirection;
};

let linedist = (p1, p2) => {
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2));
};

let interpValue = (currentPoint, nextPoint, mouseX, mouseY) => {
    let v1m1 = [Math.abs(currentPoint.x - mouseX), Math.abs(currentPoint.y - mouseY)],
        v1v2 = [Math.abs(nextPoint.x - currentPoint.x), Math.abs(nextPoint.y - currentPoint.y)];
    if (mouseX < currentPoint.x) {
        v1m1[0] = -v1m1[0];
    }
    if (mouseY > currentPoint.y) {
        v1m1[1] = -v1m1[1];
    }
    if (nextPoint.x < currentPoint.x) {
        v1v2[0] = -v1v2[0];
    }
    if (nextPoint.y > currentPoint.y) {
        v1v2[1] = -v1v2[1];
    }

    let dotprod = v1m1[0] * v1v2[0] + v1m1[1] * v1v2[1];
    let u = linedist(currentPoint, nextPoint);

    if (dotprod === 0) {
        return {
            interp: {
                x: 0,
                y: 0
            },
            value: 0
        };
    }
    let value = dotprod / u;
    let absvalue = Math.min(Math.max(0, value), u);
    let t = absvalue / u;
    let x0 = currentPoint.x,
        y0 = currentPoint.y,
    y1 = nextPoint.y,
    x1 = nextPoint.x;

    let interp = {
        x: (1 - t) * x0 + t * x1,
        y: (1 - t) * y0 + t * y1
    };
    return {
        interp,
        value,
        t,
        dist: u,
        absvalue
    };
};

let nextIndex,
    prevIndex,
    currentIndex,
    currPos;
// Create the circles
svg.selectAll('circle').data(points).enter().append('circle')
.each(function (d) {
	let el = d3.select(this);
  el.attr('cx', d.x).attr('cy', d.y)
  .attr('r', 3)
  .style('fill', '#000');
}).on('mouseover', function (d, i) {
    d3.select('.tracker').style('display', 'block')
    .attr('cx', d.x)
    .attr('cy', d.y);
    currentIndex = i;
});

let lastInterpValue,
    checkBothDirection,
    direction;

let path = svg.append('path').attr('d', d3.line().x(d => d.x).y(d => d.y)(points));
d3.select('svg').append('circle')
.attr('r', 5)
.style('display', 'none')
.style('fill','red')
.style('cursor', 'pointer')
.attr('class', 'tracker').call(d3.drag().on('drag', function () {
	let pos = d3.mouse(this),
  	x = pos[0],
    y = pos[1];

  nextIndex = Math.min(currentIndex + 1, points.length - 1);
  prevIndex = Math.max(currentIndex - 1, 0);
  let currentPoint = points[currentIndex];
  let nextPoint = points[nextIndex];
  let prevPoint = points[prevIndex];
   currPos = currPos || currentPoint;
   checkBothDirection = shouldCheckBothDirection(prevPoint, nextPoint, currentPoint, currPos);

    let interp,
    	value;
    if (checkBothDirection) {
        let interpNext = interpValue(currentPoint, nextPoint, x, y);
        let interpPrev = interpValue(currentPoint, prevPoint, x, y);
        if (interpNext.value > interpPrev.value) {
            interp = interpNext;
            value = interpNext.interp;
            direction = 'forward';
        }
        else {
            value = interpPrev.interp;
            checkPoint = prevPoint;
            interp = interpPrev;
            direction = 'backward';
        }
    }
    else {
        if (direction === 'forward') {
            interp = interpValue(currentPoint, nextPoint, x, y);
        }
        else {
            interp = interpValue(currentPoint, prevPoint, x, y);
        }
        value = interp.interp;
    }

    if (value.x === nextPoint.x && value.y === nextPoint.y) {
        currentIndex = nextIndex;
    }
    if (value.x === prevPoint.x && value.y === prevPoint.y) {
        currentIndex = prevIndex;
    }

    if (value.x === 0 && value.y === 0) {
        value = currentPoint;
        currPos = currentPoint;
        interp = {
            interp: currPos,
            t: 0
        }
    }
    else {
        currPos = {
            x: value.x,
            y: value.y
        };
    }
    lastInterpValue = interp.t;
    circle = svg.selectAll('.tracker').data([value]);
    circle.each(function (d) {
       d3.select(this).attr('cx', d.x)
       .attr('cy', d.y)
       .attr('r', 4)
       .style('fill', 'red');
   });
}));

