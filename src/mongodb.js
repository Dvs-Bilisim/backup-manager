'use strict';

const BasePlugin = require('./base');
const exec = require('child_process').exec;
const exists = require('fs').existsSync;
const files = require('fs').readdirSync;
const is = require('is_js');
const joinPath = require('path').join;
const mkdir = require('fs').mkdir;
const series = require('async/series');

class MongoDBPlugin extends BasePlugin {
    constructor(options = {}) {
        super(options);
    }

    /**
     * @description Creates a new backup
     * @param {Object} options
     * @param {Function} [cb] callback
     * @memberof MongoDBPlugin
     */
    backup(options, cb) {
        if (is.not.function(cb)) cb = function (e) { if (e) this.fail(e); };
        if (is.not.array(options)) return cb(new Error('options parameter must be an array'));

        this.configure({ tmp: `${ this.options.path }/tmp/backup-${ Math.random().toString().replace('.', '') }` });
        options.push(`--out ${ this.options.tmp }`);

        series([
            done => {
                let command = this._command(options, 'mongodump');
                console.log(command);
                if (is.not.string(command)) return cb(new Error('invalid options for mongodump'));
                exec(command, error => {
                    if (!exists(this.options.tmp)) return done(error || new Error('mongodump failed'));

                    this.success(command);
                    done();
                });
            },
            done => {
                const backups = files(this.options.tmp);
                if (is.not.array(backups) || !backups.length)
                    return done(new Error('mongodump failed'));

                const archive = `${ this.options.path }/${ this.options.filename }.tar.gz`;
                if (exists(archive) && !this.options.overwrite)
                    return done(new Error('backup file already exists'));

                let command = this._command([ '-C', this.options.tmp, '-czvf', archive, backups.join(' ') ], 'tar');
                if (is.not.string(command)) return cb(new Error('invalid options for tar'));
                exec(command, error => {
                    if (!exists(archive)) return done(error || new Error('archiving failed'));

                    this.success(command);
                    done();
                });
            }
        ], error => {
            if (error)  {
                this.fail(error.message);
                return this.clearTemporaryFolder(error, cb);
            }

            this.clearTemporaryFolder(error => {
                if (error) this.fail(error.message);
                this.purge(cb);
            });
        });
    }

    /**
     * @description Restores an existing backup
     * @param {Object} options
     * @param {Function} [cb] callback
     * @memberof MongoDBPlugin
     */
    restore(options, cb) {
        if (is.not.function(cb)) cb = function (e) { if (e) this.fail(e); };
        if (is.not.array(options)) return cb(new Error('options parameter must be an array'));

        this.configure({ tmp: `${ this.options.path }/tmp/restore-${ Math.random().toString().replace('.', '') }` });

        series([
            done => {
                mkdir(this.options.tmp, error => {
                    if (!exists(this.options.tmp)) return done(error || new Error('mkdir failed'));

                    done();
                });
            },
            done => {
                this.recentBackupFile(file => {
                    if (is.not.string(file)) return cb(new Error('backup file not found'));

                    file = `${this.options.path}/${ file }`;
                    if (!exists(file)) return cb(new Error(`${ file } does not exist`));

                    let command = this._command([ '-xzvf', file, '-C', this.options.tmp ], 'tar');
                    if (is.not.string(command)) return cb(new Error('invalid options for tar'));
                    exec(command, error => {
                        if (error) return done(error);

                        const backup = files(this.options.tmp);
                        if (is.not.array(backup) || !backup.length) return done(new Error('extracting backup failed'));

                        this.success(command);
                        done();
                    });
                });
            },
            done => {
                options.push(joinPath(this.options.tmp, './*'));
                let command = this._command(options, 'mongorestore');
                if (is.not.string(command)) return cb(new Error('invalid options for mongorestore'));
                exec(command, error => {
                    if (!exists(this.options.tmp)) return done(error || new Error('mongorestore failed'));

                    this.success(command);
                    done();
                });
            }
        ], error => {
            if (error)  {
                this.fail(error.message);
                return this.clearTemporaryFolder(error, cb);
            }

            this.clearTemporaryFolder(error => {
                if (error) this.fail(error.message);
                cb();
            });
        });
    }
}

module.exports = MongoDBPlugin;
