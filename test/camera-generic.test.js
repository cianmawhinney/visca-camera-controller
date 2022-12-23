const ViscaCamera = require('../src/camera');
const stream = require('stream');

const mockConnection = new stream.Duplex();
mockConnection._write = () => {};
mockConnection._read = () => {};

let camera;
beforeEach(() => {
    camera = new ViscaCamera({
        viscaAddress: 1,
        connection: mockConnection,
    });

    jest.spyOn(camera, 'send').mockImplementation(() => 'Hello');
})

describe('ViscaCamera', () => {
    describe('constructor', () => {
        it('should be a ViscaCamera', () => {
            expect(camera).toBeInstanceOf(ViscaCamera);
        })
    })
    
    describe('move', () => {    
        it('should create packet correctly from input values', () => {
            camera.move(1, 1);
            const correctBuffer = Buffer.from('8101060101010202FF', 'hex');
            expect(camera.send).toHaveBeenCalledTimes(1);
            expect(camera.send).toHaveBeenCalledWith(correctBuffer, expect.anything());
        })

        it.todo('should constrain the input values to an acceptable range');
    })
})

