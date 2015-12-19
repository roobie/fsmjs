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

    var eventStreams = {};
    var mapTransitionTo = {};
    var mapTransitionFrom = {};

    var ON = 'on';
    var changeState = function(event, data) {
      var transitionName = event.transitionName,
          toState = event.toState;
      // note order of arguments
      eventStreams[ON + transitionName].call(null, data, event);
      currentState = toState;
      eventStreams[ON + toState].call(null, data, event);
    };

    var addStream = function (name) {
      stateMachine[ON + name] = Event(function (broadcast) {
        eventStreams[ON + name] = broadcast;
      });
    };
    var transitions = cfg.transitions;
    Object.keys(cfg.transitions).forEach(function (transitionName) {
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
