% outputFolder = fullfile(tempdir, '')
%rootFolder = fullfile('Z:')

imds = imageDatastore({'Stimuli\Birds\',
    'Stimuli\Cats',
    'Stimuli\Flowers\*',
    'Stimuli\People\*',
	'Stimuli\Hoofstock\*'},'LabelSource', 'foldernames');

% fullfile(rootFolder, categories), 'LabelSource', 'foldernames');

tbl = countEachLabel(imds)

minSetCount = min(tbl{:,2}); % determine the smallest amount of images in a category

% Use splitEachLabel method to trim the set.
imds = splitEachLabel(imds, minSetCount, 'randomize');

% Notice that each set now has exactly the same number of images.
countEachLabel(imds)


% Location of pre-trained "AlexNet"
cnnURL = 'http://www.vlfeat.org/matconvnet/models/beta16/imagenet-caffe-alex.mat';
% Store CNN model in a temporary folder
cnnMatFile = fullfile(tempdir, 'imagenet-caffe-alex.mat');


if ~exist(cnnMatFile, 'file') % download only once
    disp('Downloading pre-trained CNN model...');
    websave(cnnMatFile, cnnURL);
end


% Load MatConvNet network into a SeriesNetwork
convnet = helperImportMatConvNet(cnnMatFile)
