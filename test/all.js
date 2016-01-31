var should = require('should');
var fsm = require('../fsm');

describe('fsm', function () {
  var getMachine1 = function () {
    return fsm({
      initialState: 'green',
      transitions: {
        clear: { from: '*', to: 'green' },
        warn: { from: 'green', to: 'yellow' },
        alert: { from: ['green', 'yellow'], to: 'red' },
      }
    });
  };


  describe('init', function () {

    var m = getMachine1();

    it('should correctly set the initial state', function () {
      m.state().should.equal('green');
    });

    it('can should work after init', function () {
      m.can('warn').should.be.exactly(true);
    });

    it('should require an initial state', function () {
      (function () {
        fsm({
          initial: null,
          transitions: {}
        });
      }).should.throw();
    });
    it('should require transitions', function () {
      (function () {
        fsm({
          initial: 'state',
          transitions: null
        });
      }).should.throw();
    });

  });

  describe('basic API', function () {


    it('is, state', function () {
      var m = getMachine1();

      m.state().should.equal('green');
      m.is('green').should.be.exactly(true);

    });

    it('can', function () {
      var m = getMachine1();

      m.can('warn').should.be.exactly(true);
      m.can('alert').should.be.exactly(true);
      // * matches ALL states.
      m.can('clear').should.be.exactly(true);
    });

    it('can after transition', function () {
      var m = getMachine1();
      // transition
      m.warn();
      m.can('alert').should.be.exactly(true);
      m.can('clear').should.be.exactly(true);
      m.cannot('warn').should.be.exactly(true);
    });

    it('should return correct allowedTransitions', function () {
      var m = getMachine1();
      m.allowedTransitions().should.deepEqual(['clear', 'warn', 'alert']);
      m.warn();
      m.allowedTransitions().should.deepEqual(['clear', 'alert']);
    });

    it('should not allow a forbidden transition', function () {
      var m = getMachine1();
      m.warn();
      m.cannot('warn').should.be.true();
      should.throws(function () {
        m.warn();
      });
    });

    it('should transition correctly', function () {
      var m = getMachine1();
      m.warn();
      m.state().should.equal('yellow');
      m.alert();
      m.state().should.equal('red');
    });

    it('should allow to transition into the same state if allowed per `from`', function () {
      var m = getMachine1();
      m.clear();
      m.clear();
    });

    it('should trigger events correctly', function () {
      var m = getMachine1();
      var c = 0;
      var inc = function () {c++;};
      m.onwarn(inc);
      m.onyellow(inc);
      m.onalert(inc);
      m.onred(inc);
      m.warn();

      m.alert();
      c.should.equal(4);
    });

    it('should allow to add methods to the instance', function () {
      var states = {
        down: 'down',
        up: 'up'
      };

      var machine = fsm({
        initialState: states.down,
        transitions: {
          start: { from: states.down
                   , to: states.up
                 },

          stop: { from: states.up
                  , to: states.down
                }
        },
        methods: {
          connected:  function () {
            return this.is('up');
          },
          disconnected: function () {
            return this.is('down');
          }
        },
        extensions: {
          constructor: {
            value: function ConnFsm() {}
          }
        }
      });

      machine.connected.should.be.a.Function();

      machine.connected().should.be.False();

      machine.constructor.name.should.equal('ConnFsm');

      machine.toString().should.equal('[object ConnFsm]@down');
    });
  });


  describe('streams', function () {

    it('should trigger events for transitions correctly', function () {
      var m = getMachine1();
      var c = 0;
      var inc = function () {c++;};
      m.onwarn(inc);
      m.onalert(inc);
      m.warn();

      m.alert();
      c.should.equal(2);
    });

    it('should be able to pass data from the transition function call to the event handler', function () {
      var m = getMachine1();
      var c = 0;
      m.onclear(function (event) {
        c += event.data;
      });

      m.clear(1);
      m.clear(2);

      c.should.equal(3);
    });

    it('stream callbacks should receive state machine metadata', function (done) {
      var m = getMachine1();
      var c = 0;
      m.onclear(function (event) {
        event.transitionName.should.equal('clear');
        event.fromState.should.equal('green');
        event.toState.should.equal('green');
        done();
      });

      m.clear();
    });

    it('should trigger events for states enterings correctly', function () {
      var m = getMachine1();
      var c = 0;
      var inc = function () {c++;};
      m.onyellow(inc);
      m.onred(inc);

      m.warn();
      m.alert();

      c.should.equal(2);
    });

    it('should be able to remove a listener', function () {

      var m = getMachine1();
      var c = 0;
      var inc = function () {c++;};
      var rem = m.onyellow(inc);
      m.onred(inc);

      m.warn();
      m.alert();

      c.should.equal(2);

      m.clear();

      rem();

      m.warn();
      c.should.equal(2);

    });

    it('should should trigger in correct order', function () {

      var order = [];
      var push = function (num) {
        return function () {
          order.push(num);
        };
      };
      var mc = getMachine1();

      // go to yellow state
      mc.warn();

      mc.onbeforeclear(push(0));
      mc.onexityellow(push(1));
      mc.onentergreen(push(2));
      mc.ongreen(push(3));
      mc.onclear(push(4));
      mc.onafterclear(push(5));

      // trigger all streams above
      mc.clear();

      order.should.deepEqual([0,1,2,3,4,5]);


    });


  });

  describe('placeholder', function () {

    it('should ', function () {


    });

  });

});
