;var fsm = (function () {
  'use strict';
  var Event = function Source(broadcaster) {
    // @see https://github.com/Raynos/geval/
    function Event() {
      var listeners = [];
      return { broadcast: broadcast, listen: event };
      function broadcast(value) {
        for (var i = 0; i < listeners.length; i++) {
          listeners[i](value);
        }
      }
      function event(listener) {
        listeners.push(listener);
        return removeListener;
        function removeListener() {
          var index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      }
    }
    var tuple = Event();
    broadcaster(tuple.broadcast);
    return tuple.listen;
  };

  var contains = function contains(list, item) {
    return list.indexOf(item) !== -1;
  };

  var slice = Function.prototype.call.bind(Array.prototype.slice);

  return function fsm(cfg) {
    /**
     @example
     ```
     cfg = {
       initial: String,
       transitions: {
         transitionName: { from: String|Array<String>, to: String}
       }
     }
     ```
     */
    function FiniteStateMachine() {};
    FiniteStateMachine.prototype = {
      constructor: FiniteStateMachine,
      state: function () {},
      can: function (transitionName) {},
      cannot: function (transitionName) {},
      is: function (stateName) {},
      allowedTransitions: function () {}
    };

    var stateMachine = new FiniteStateMachine();
    var currentState = cfg.initial || '';
    stateMachine.state = function fsmState() {
      return currentState;
    };
    stateMachine.is = function fsmIs(state) {
      return stateMachine.state() === state;
    };

    stateMachine.can = function fsmCan(transitionName) {
      var allowedStates = mapTransitionFrom[transitionName];
      return contains(allowedStates, currentState);
    };
    stateMachine.cannot = function fsmCan(transitionName) {
      return !stateMachine.can(transitionName);
    };

    // { onNAME => stream }
    var eventStreams = {};

    // { String => String }
    var mapTransitionTo = {};
    // { String => Array<String> }
    var mapTransitionFrom = {};

    var ON = 'on';

    /**
     event => {
       transitionName:String,
       fromState:String,
       toState:String
     },
     data => Any
     */
    var changeState = function(event, data) {
      var transitionName = event.transitionName,
          toState = event.toState;
      // note order of arguments
      eventStreams[ON + transitionName].call(null, data, event);
      currentState = toState;
      eventStreams[ON + toState].call(null, data, event);
    };

    // Add a stream to the state machine
    // e.g. if name is 'alert':
    // then a property called onalert will be created
    // on the stateMachine, and it will have the interface
    // of a geval Event.
    var addStream = function (name) {
      stateMachine[ON + name] = Event(function (broadcast) {
        eventStreams[ON + name] = broadcast;
      });
    };

    // The below code rigs and wires the state machine internals.
    var transitions = cfg.transitions;
    Object.keys(cfg.transitions).forEach(function (transitionName) {
      // for each of the transitions, we are going to:
      // 1. add the transition as a function bound to a property
      //    on the state machine. The property name will be the same
      //    as the transition name
      // 2. add streams for both transitions being executed and
      //    states being entered as properties on the state machine
      //    object.
      var transition = transitions[transitionName],
          from = transition.from,
          to = transition.to;

      from = Array.isArray(from)? from : [from];

      mapTransitionFrom[transitionName] = from;
      mapTransitionTo[transitionName] = to;

      stateMachine[transitionName] = function (data) {
        if (stateMachine.can(transitionName)) {
          return changeState({
            transitionName: transitionName,
            fromState: currentState,
            toState: mapTransitionTo[transitionName]
          }, data);
        }
        throw Error([
          'Invalid transition!',
          'Transition:', transitionName,
          'is not valid from state:', currentState
        ].join(' '));
      };

      addStream(transitionName);
      from.forEach(function (fromState) {
        addStream(fromState);
      });
      addStream(to);
    });

    return stateMachine;
  };

})();
