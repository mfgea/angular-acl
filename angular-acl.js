'use strict';

angular.module('mm.acl', []);

angular.module('mm.acl').provider('AclService', [
  function () {

    /**
     * Polyfill for IE8
     *
     * http://stackoverflow.com/a/1181586
     */
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function (needle) {
        var l = this.length;
        for (; l--;) {
          if (this[l] === needle) {
            return l;
          }
        }
        return -1;
      };
    }

    /**
     * each implementation (based on underscore, http://underscorejs.org/docs/underscore.html)
     */
    function each(obj, iteratee) {
      var i, length, key;
      if (typeof obj.length === 'number' && obj.length >= 0) {
        for (i = 0, length = obj.length; i < length; i++) {
          iteratee(obj[i], i, obj);
        }
      } else {
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            iteratee(obj[key], key, obj);
          }
        }
      }
      return obj;
    }

    var config = {
      storage: 'sessionStorage',
      storageKey: 'AclService'
    };

    var data = {
      roles: [],
      abilities: {}
    };

    /**
     * Does the given role have abilities granted to it?
     *
     * @param role
     * @returns {boolean}
     */
    var roleHasAbilities = function (role) {
      return (typeof data.abilities[role] === 'object');
    };

    /**
     * Retrieve the abilities array for the given role
     *
     * @param role
     * @returns {Array}
     */
    var getRoleAbilities = function (role) {
      return (roleHasAbilities(role)) ? data.abilities[role] : [];
    };

    /**
     * Persist data to storage based on config
     */
    var save = function () {
      switch (config.storage) {
        case 'sessionStorage':
          saveToStorage('sessionStorage');
          break;
        case 'localStorage':
          saveToStorage('localStorage');
          break;
        default:
          // Don't save
          return;
      }
    };

    /**
     * Persist data to web storage
     */
    var saveToStorage = function (storagetype) {
      window[storagetype].setItem(config.storageKey, JSON.stringify(data));
    };

    /**
     * Retrieve data from web storage
     */
    var fetchFromStorage = function (storagetype) {
      var data = window[storagetype].getItem(config.storageKey);
      return (data) ? JSON.parse(data) : false;
    };

    var AclService = {};
    AclService.resume = resume;


    /**
     * Restore data from web storage.
     *
     * Returns true if web storage exists and false if it doesn't.
     *
     * @returns {boolean}
     */
    function resume() {
      var storedData;

      switch (config.storage) {
        case 'sessionStorage':
          storedData = fetchFromStorage('sessionStorage');
          break;
        case 'localStorage':
          storedData = fetchFromStorage('localStorage');
          break;
        default:
          storedData = null;
      }
      if (storedData) {
        angular.extend(data, storedData);
        return true;
      }

      return false;
    }

    /**
     * Attach a role to the current user
     *
     * @param role
     */
    AclService.attachRole = function (role) {
      if (data.roles.indexOf(role) === -1) {
        data.roles.push(role);
        save();
      }
    };

    /**
     * Remove role from current user
     *
     * @param role
     */
    AclService.detachRole = function (role) {
      var i = data.roles.indexOf(role);
      if (i > -1) {
        data.roles.splice(i, 1);
        save();
      }
    };

    /**
     * Remove all roles from current user
     */
    AclService.flushRoles = function () {
      data.roles = [];
      save();
    };

    /**
     * Check if the current user has role attached
     *
     * @param role
     * @returns {boolean}
     */
    AclService.hasRole = function (role) {
      return (data.roles.indexOf(role) > -1);
    };

    /**
     * Returns the current user roles
     * @returns {Array}
     */
    AclService.getRoles = function () {
      return data.roles;
    };

    /**
     * Set the abilities object (overwriting previous abilities)
     *
     * Each property on the abilities object should be a role.
     * Each role should have a value of an array. The array should contain
     * a list of all of the roles abilities.
     *
     * Example:
     *
     *    {
     *        guest: ['login'],
     *        user: ['logout', 'view_content'],
     *        admin: {'logout':'any', 'content':'read', 'manage_users': ['read', 'create', 'delete', 'edit']}
     *    }
     *
     * @param abilities
     */
    AclService.setAbilities = function (abilitiesDefinition) {
      var self = this;
      data.abilities = {};
      each(abilitiesDefinition, function(abilities, role){
          self.setRoleAbilities(role, abilities);
      });
      save();
    };

    /**
     * Set abilities for a given role (overwriting previous abilities)
     *
     * The abilities param should have a value of an array or object. The array or object
     * should contain a list of all of the roles abilities.
     *
     * Example:
     *
     *    (admin, {'logout':'any', 'content':'read', 'manage_users': ['read', 'create', 'delete', 'edit']})
     *
     * @param role
     * @param abilities
     */
    AclService.setRoleAbilities = function (role, abilities) {
      var self = this;
      data.abilities[role] = {};

      if(typeof abilities === 'string') {
        self.addAbility(role, abilities);
      } else {
        each(abilities, function(permissions, ability) {
          self.addAbility(role, ability, permissions);
        });
      }
      save();
    };

    /**
     * Add an ability to a role
     *
     * @param role
     * @param ability
     */
    AclService.addAbility = function (role, ability, permissions) {
      if (!data.abilities[role]) {
        data.abilities[role] = {};
      }
      if (!permissions) {
        permissions = ['any'];
      }
      data.abilities[role][ability] = permissions;
      save();
    };

    /**
     * Does current user have permission to do something?
     *
     * @param ability
     * @param perrmission
     * @returns {boolean}
     */
    AclService.can = function (ability, permission) {
      // Helper function: calculates equivalencies between permissions
      function getExpandedPermissions (permission) {
        var perms = [];
        switch (permission) {
            case 'write':
                perms = ['create', 'edit', 'delete'];
                break;
            case 'create':
            case 'edit':
            case 'delete':
                perms = ['write'];
                break;
        }
        perms.push(permission);
        return perms;
      }

      // Helper function: checks if permissions fit into allowed ones
      function checkPermissions(allowedPermissions, permissions) {
        if(allowedPermissions.indexOf('none') > -1) {
          return false;
        }

        if(allowedPermissions.indexOf('any') > -1 || allowedPermissions.length && permissions.indexOf('any') > -1) {
          return true;
        }

        var permission;
        var isValid = false;
        each(permissions, function(permission) {
          if(allowedPermissions.indexOf(permission) > -1) {
            isValid = true;
          }
        });
        return isValid;
      }

      var role, abilities, i, length, expandedPermissions;
      var canDoIt = false;

      if(!permission) {
        permission = 'any';
      }

      each(data.roles, function(role) {
        abilities = getRoleAbilities(role);
        expandedPermissions = getExpandedPermissions(permission);
        if (abilities[ability] && checkPermissions(abilities[ability], expandedPermissions)) {
          // Ability is in role abilities
          canDoIt = true;
        }
      });

      // We made it here, so the ability wasn't found in attached roles
      return canDoIt;
    };

    /**
     * Does current user have any of the required permission to do something?
     *
     * @param abilities [array]
     * @returns {boolean}
     */
    AclService.canAny = function (abilities) {
      var role, roleAbilities;
      // Loop through roles
      var l = data.roles.length;
      var j = abilities.length;

      for (; l--;) {
        // Grab the the current role
        role = data.roles[l];
        roleAbilities = getRoleAbilities(role);

        for (; j--;){
          if (roleAbilities.indexOf(abilities[j]) > -1) {
            // Ability is in role abilities
            return true;
          }
        }
      }
      // We made it here, so the ability wasn't found in attached roles
      return false;
    };

    return {
      config: function (userConfig) {
        angular.extend(config, userConfig);
      },
      resume: resume,
      $get: function () {
        return AclService;
      }
    };

  }
]);
