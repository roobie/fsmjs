# fsmjs
JavaScript Finite State Machine with streams


```javascript
var logger = function (arg) {
  return function () {
    log(arg);
  }
}
var machine = fsm({
  initialState: 'green',
  transitions: {
    clear: { from: '*', to: 'green' },
    warn: { from: 'green', to: 'yellow' },
    alert: { from: ['green', 'yellow'], to: 'red' },
  }
});
machine.warn();

machine.onbeforeclear(logger('1. before clear'));
machine.onexityellow(logger('2. exited yellow'));
machine.onentergreen(logger('3. entered green'));
machine.ongreen(logger('4. green'));
machine.onclear(logger('5. clear'));
machine.onafterclear(logger('6. after clear'));

machine.clear();


```
