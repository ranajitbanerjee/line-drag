let svg = d3.select('body').append('svg').attr('width', '600')
	.attr('height', '600');

let points = [{
	x: 50,
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
    let checkBothDirection = false;
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

let getVectorProjection = (currentPoint, nextPoint, mouseVector) => {
    let mouseX = mouseVector.x,
        mouseY = mouseVector.y;

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
    let u = Math.sqrt(v1v2[0] * v1v2[0] + v1v2[1] * v1v2[1]);

    let projection = dotprod !== 0 ? dotprod / u : dotprod;
    return Math.min(Math.max(0, projection), u);;
};


let getInterpolatedValue = (currentPoint, nextPoint, mouseVector) => {
    let projection = getVectorProjection(currentPoint, nextPoint, mouseVector);
    let dist = linedist(currentPoint, nextPoint);
    if (projection === 0) {
        return {
            value: currentPoint,
            projection: 0
        };
    }

    let t = projection / dist;
    let x0 = currentPoint.x,
        y0 = currentPoint.y,
    y1 = nextPoint.y,
    x1 = nextPoint.x;

    let value = {
        x: (1 - t) * x0 + t * x1,
        y: (1 - t) * y0 + t * y1
    };

    return {
        value,
        projection
    };
};

let updateTrackerCircle = (value) => {
    circle = svg.selectAll('.tracker').data([value]);
    circle.each(function (d) {
       d3.select(this).attr('cx', d.x)
       .attr('cy', d.y)
   });
};

let nextIndex,
    prevIndex,
    currentIndex,
    mouseVector = {},
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
    mouseVector.x = d.x;
    mouseVector.y = d.y;
});

let checkBothDirection,
    direction;

let onDrag = () => {
    nextIndex = Math.min(currentIndex + 1, points.length - 1);
    prevIndex = Math.max(currentIndex - 1, 0);

    let currentPoint = points[currentIndex];
    let nextPoint = points[nextIndex];
    let prevPoint = points[prevIndex];
    let index = Math.max(Math.min(currentIndex, points.length - 1), 0);

    if (currPos && currPos.x === currentPoint.x && currPos && currPos.y === currentPoint.y) {
        mouseVector.x = points[index].x;
        mouseVector.y = points[index].y;
    }

    currPos = currPos || currentPoint;

    mouseVector.x += d3.event.dx;
    mouseVector.y += d3.event.dy;

    checkBothDirection = shouldCheckBothDirection(prevPoint, nextPoint, currentPoint, currPos);

    let interp,
        value;

    if (checkBothDirection) {
        let interpNext = getInterpolatedValue(currentPoint, nextPoint, mouseVector);
        let interpPrev = getInterpolatedValue(currentPoint, prevPoint, mouseVector);
        if (interpNext.projection > interpPrev.projection) {
            value = interpNext.value;
            direction = 'forward';
        }
        else {
            value = interpPrev.value;
            direction = 'backward';
        }
    }
    else {
        if (direction === 'forward') {
            interp = getInterpolatedValue(currentPoint, nextPoint, mouseVector);
        }
        else {
            interp = getInterpolatedValue(currentPoint, prevPoint, mouseVector);
        }
        value = interp.value;
    }

    if (value.x === nextPoint.x && value.y === nextPoint.y) {
        currentIndex = nextIndex;
    }
    if (value.x === prevPoint.x && value.y === prevPoint.y) {
        currentIndex = prevIndex;
    }

    currPos = {
        x: value.x,
        y: value.y
    };

    updateTrackerCircle(value);
};

let path = svg.append('path').attr('d', d3.line().x(d => d.x).y(d => d.y)(points));

d3.select('svg').append('circle')
.attr('r', 5)
.style('display', 'none')
.style('fill','red')
.style('cursor', 'pointer')
.attr('class', 'tracker').call(d3.drag().on('drag', onDrag));