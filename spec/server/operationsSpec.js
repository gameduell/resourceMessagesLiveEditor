describe('operations', () => {

    var operations, dao, changesNotifier;

    describe('attachClientCallbacks', () => {

        var clientCallbacks;

        beforeAll((done) => {
            clientCallbacks = {
                onSomethingHappened : function() {}
            };
            done();
        });

        beforeEach((done) => {
            changesNotifier = require('../../lib/server/changesNotifier.js')();
            // dao does nothing here
            operations = require('../../lib/server/operations.js')({}, changesNotifier);

            spyOn(changesNotifier, 'addListener');

            done();
        });

        it('attachClientCallbacks will add listener to changesNotifier', (done) => {

            operations.attachClientCallbacks(clientCallbacks);

            // matching on the first parameter is not perfect: we're using a number here but could be any string
            expect(changesNotifier.addListener).toHaveBeenCalledWith(jasmine.any(Number), clientCallbacks);

            done();
        });

        it('attachClientCallbacks will return the assigned client listener id', (done) => {
            var clientListenerId = operations.attachClientCallbacks(clientCallbacks);

            expect(clientListenerId).toBeDefined();

            done();
        });
    });

    describe('detachClientCallbacks', () => {

        var clientCallbacks;
        var clientListenerId;

        beforeAll((done) => {
            clientCallbacks = {
                onSomethingHappened : function() {}
            };
            done();
        });

        beforeEach((done) => {
            changesNotifier = require('../../lib/server/changesNotifier.js')();
            // dao does nothing here
            operations = require('../../lib/server/operations.js')({}, changesNotifier);

            clientListenerId = operations.attachClientCallbacks(clientCallbacks);

            spyOn(changesNotifier, 'removeListener');

            done();
        });

        it('detachClientCallbacks will remove listener from changesNotifier', (done) => {

            operations.detachClientCallbacks(clientListenerId);

            // matching on the first parameter is not perfect: we're using a number here but could be any string
            expect(changesNotifier.removeListener).toHaveBeenCalledWith(clientListenerId);

            done();
        })
    });

    describe('createNewProject', () => {

        var projectParentDirId = '/';
        var projectName = 'newProject';
        var expectedProjectId = projectParentDirId + projectName;
        var projectDefaults = {};

        describe('successful cases', () => {

            beforeEach((done) => {
                dao = {
                    createNewProject : function(projectParentDirId, projectName, projectDefaults, callback) {
                        callback(null, {
                            projectId : expectedProjectId
                        });
                    },
                    invalidateSearch : function() {}
                };

                operations = require('../../lib/server/operations.js')(dao, changesNotifier);

                spyOn(changesNotifier, 'notify');

                done();
            });

            it('makes dao create new project', (done) => {

                operations.createNewProject(projectParentDirId, projectName, projectDefaults, (err, projectData) => {
                    expect(err).toBeFalsy();
                    expect(projectData).toBeTruthy();
                    expect(projectData.projectId).toEqual(expectedProjectId);
                    done();
                });
            });

            it('should trigger notifications on successful dao call', (done) => {

                operations.createNewProject(projectParentDirId, projectName, projectDefaults, (err, projectData) => {
                    expect(err).toBeFalsy();
                    expect(projectData).toBeTruthy();
                });

                expect(changesNotifier.notify).toHaveBeenCalledWith('newProjectWasCreated', [ expectedProjectId ], jasmine.any(Number));
                done();
            });

        });

        describe('fail cases', () => {
            beforeEach((done) => {
                dao = {
                    createNewProject : function(projectParentDirId, projectName, projectDefaults, callback) {
                        callback(new Error());
                    },
                    invalidateSearch : function() {}
                };
                operations = require('../../lib/server/operations.js')(dao, changesNotifier);

                done();
            });

            it('callback returns err if dao call fails', (done) => {

                operations.createNewProject(projectParentDirId, projectName, projectDefaults, (err, projectData) => {
                    expect(err).toBeTruthy();
                    expect(projectData).toBeFalsy();
                    done();
                });

            });
        });
    });
});
