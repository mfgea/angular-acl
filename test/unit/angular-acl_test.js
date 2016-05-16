/* globals describe, beforeEach, it, inject, expect */
'use strict';

describe('AclService', function () {
  var AclService;

  beforeEach(module('mm.acl'));

  beforeEach(inject(function (_AclService_) {
    AclService = _AclService_;
  }));

  describe('roleHasAbilities()', function () {

    it('should return true data object has role as a property with an array value', function () {
      expect(AclService._roleHasAbilities('foo')).toBeFalsy();
      AclService._data.abilities.foo = [];
      expect(AclService._roleHasAbilities('foo')).toBeTruthy();
    });

  });

  describe('getRoleAbilities()', function () {

    it('should return the role abilities array', function () {
      AclService._data.abilities.foo = ['bar', 'baz'];
      var abilities = AclService._getRoleAbilities('foo');
      expect(abilities).toEqual(['bar', 'baz']);
    });

    it('should return empty array when role does not exist', function () {
      var abilities = AclService._getRoleAbilities('foo');
      expect(abilities).toEqual([]);
    });

  });

  describe('attachRole()', function () {

    it('should add role to current session', function () {
      expect(AclService._data.roles).toEqual([]);
      AclService.attachRole('foo');
      expect(AclService._data.roles).toEqual(['foo']);
    });

    it('should add role only once', function () {
      expect(AclService._data.roles).toEqual([]);
      AclService.attachRole('foo');
      AclService.attachRole('foo');
      AclService.attachRole('foo');
      expect(AclService._data.roles).toEqual(['foo']);
    });

  });

  describe('detachRole()', function () {

    it('should remove role to current session', function () {
      AclService._data.roles = ['foo'];
      AclService.detachRole('foo');
      expect(AclService._data.roles).toEqual([]);
    });

    it('should not throw an error if role does not exist', function () {
      expect(AclService._data.roles).toEqual([]);
      AclService.detachRole('foo');
      expect(AclService._data.roles).toEqual([]);
    });

  });

  describe('flushRole()', function () {

    it('should reset roles to an empty array', function () {
      AclService._data.roles = ['foo', 'bar', 'baz'];
      expect(AclService._data.roles).toEqual(['foo', 'bar', 'baz']);
      AclService.flushRoles();
      expect(AclService._data.roles).toEqual([]);
    });

  });

  describe('hasRole()', function () {

    it('should return true if role is in current session', function () {
      AclService._data.roles = ['foo'];
      expect(AclService.hasRole('foo')).toBeTruthy();
    });

    it('should return false if role is not in current session', function () {
      AclService._data.roles = [];
      expect(AclService.hasRole('foo')).toBeFalsy();
    });

  });

  describe('getRoles()', function () {

    it('should return all the roles in current session', function () {
      AclService._data.roles = ['foo', 'bar'];
      expect(AclService.getRoles()).toEqual(['foo', 'bar']);
    });

  });

  describe('setAbilities()', function () {

    it('should set given param to abilities', function () {
      var abilities = { 'foo': 'bar' };
      expect(AclService._data.abilities).not.toEqual(abilities);
      AclService.setAbilities(abilities);
      expect(AclService._data.abilities).toEqual({ 'foo': { 'bar': ['any'] }});
    });

  });

  describe('can() with permissions', function () {

    it('should return wether the role can operate according to abilities defined as an array', function() {
      AclService.addAbility('foo', 'bar');
      AclService.addAbility('foo', 'baz');
      AclService.attachRole('foo');

      expect(AclService.can('bar')).toBeTruthy();
      expect(AclService.can('bar', 'read')).toBeTruthy();
      expect(AclService.can('bar', 'write')).toBeTruthy();
      expect(AclService.can('bar', 'create')).toBeTruthy();
      expect(AclService.can('bar', 'edit')).toBeTruthy();
      expect(AclService.can('bar', 'delete')).toBeTruthy();
      expect(AclService.can('bay')).toBeFalsy();
    });

    it('should return whether the role can operate according to abilities defined using general keywords', function() {
      AclService.addAbility('foo', 'bar', 'any');
      AclService.addAbility('foo', 'baz', 'none');
      AclService.attachRole('foo');

      expect(AclService.can('bar')).toBeTruthy();
      expect(AclService.can('bar', 'read')).toBeTruthy();
      expect(AclService.can('bar', 'write')).toBeTruthy();
      expect(AclService.can('bar', 'create')).toBeTruthy();
      expect(AclService.can('bar', 'edit')).toBeTruthy();
      expect(AclService.can('bar', 'delete')).toBeTruthy();
      expect(AclService.can('baz')).toBeFalsy();
      expect(AclService.can('baz', 'read')).toBeFalsy();
      expect(AclService.can('baz', 'write')).toBeFalsy();
      expect(AclService.can('baz', 'create')).toBeFalsy();
      expect(AclService.can('baz', 'edit')).toBeFalsy();
      expect(AclService.can('baz', 'delete')).toBeFalsy();
    });

    it('should return whether the role can operate according to read/write syntax definitions', function() {
      AclService.addAbility('foo', 'bar', 'read');
      AclService.addAbility('foo', 'baz', 'write');
      AclService.attachRole('foo');

      expect(AclService.can('bar')).toBeTruthy();
      expect(AclService.can('bar', 'read')).toBeTruthy();
      expect(AclService.can('bar', 'write')).toBeFalsy();
      expect(AclService.can('bar', 'create')).toBeFalsy();
      expect(AclService.can('bar', 'edit')).toBeFalsy();
      expect(AclService.can('bar', 'delete')).toBeFalsy();
      expect(AclService.can('baz')).toBeTruthy();
      expect(AclService.can('baz', 'read')).toBeFalsy();
      expect(AclService.can('baz', 'write')).toBeTruthy();
      expect(AclService.can('baz', 'create')).toBeTruthy();
      expect(AclService.can('baz', 'edit')).toBeTruthy();
      expect(AclService.can('baz', 'delete')).toBeTruthy();

    });

    it('should return whether the role can operate according to atomic permissions defined as arrays', function() {
      AclService.addAbility('foo', 'bar', ['read', 'create']);
      AclService.addAbility('foo', 'baz', ['read', 'edit', 'delete']);
      AclService.attachRole('foo');

      expect(AclService.can('bar')).toBeTruthy();
      expect(AclService.can('bar', 'read')).toBeTruthy();
      expect(AclService.can('bar', 'write')).toBeTruthy();
      expect(AclService.can('bar', 'create')).toBeTruthy();
      expect(AclService.can('bar', 'edit')).toBeFalsy();
      expect(AclService.can('bar', 'delete')).toBeFalsy();
      expect(AclService.can('baz')).toBeTruthy();
      expect(AclService.can('baz', 'read')).toBeTruthy();
      expect(AclService.can('baz', 'write')).toBeTruthy();
      expect(AclService.can('baz', 'create')).toBeFalsy();
      expect(AclService.can('baz', 'edit')).toBeTruthy();
      expect(AclService.can('baz', 'delete')).toBeTruthy();

    });

    it('should return whether the role can operate according to custom permissions', function() {
      AclService.addAbility('foo', 'bar', ['read', 'ban']);
      AclService.addAbility('foo', 'baz', ['read', 'ban', 'unban']);
      AclService.attachRole('foo');

      expect(AclService.can('bar')).toBeTruthy();
      expect(AclService.can('bar', 'read')).toBeTruthy();
      expect(AclService.can('bar', 'ban')).toBeTruthy();
      expect(AclService.can('bar', 'unban')).toBeFalsy();
      expect(AclService.can('baz')).toBeTruthy();
      expect(AclService.can('baz', 'read')).toBeTruthy();
      expect(AclService.can('baz', 'ban')).toBeTruthy();
      expect(AclService.can('baz', 'unban')).toBeTruthy();

    });

  });

  describe('Readme Examples', function() {

    it('should check the "can()" function example', function() {
      // Setup some abilities
      AclService.addAbility('moderator', 'users', ['read', 'ban', 'unban']);
      AclService.addAbility('admin', 'users');

      // Add moderator role to the current user
      AclService.attachRole('moderator');

      // Check if the current user has these permissions
      expect(AclService.can('users', 'ban')).toBeTruthy();
      expect(AclService.can('users', 'create')).toBeFalsy();

      // Add admin role to the current user
      AclService.attachRole('admin');

      // Check if the current user has these permissions
      expect(AclService.can('users', 'create')).toBeTruthy();
    });
  });
});
