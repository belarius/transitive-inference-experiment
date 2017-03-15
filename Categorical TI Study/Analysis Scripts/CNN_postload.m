% Load MatConvNet network into a SeriesNetwork
convnet = helperImportMatConvNet(cnnMatFile)

% View the CNN architecture
convnet.Layers

% Set the ImageDatastore ReadFcn
imds.ReadFcn = @(filename)readAndPreprocessImage(filename);



%%
%

[trainingSet, testSet] = splitEachLabel(imds, 0.3, 'randomize');

% Get the network weights for the second convolutional layer
w1 = convnet.Layers(2).Weights;

% Scale and resize the weights for visualization
w1 = mat2gray(w1);
w1 = imresize(w1,5);

% Display a montage of network weights. There are 96 individual sets of
% weights in the first layer.
figure
montage(w1)
title('First convolutional layer weights')


featureLayer = 'fc7';
trainingFeatures = activations(convnet, trainingSet, featureLayer, ...
    'MiniBatchSize', 32, 'OutputAs', 'columns');
%%% above command is where the GPU issues kick in

% Get training labels from the trainingSet
trainingLabels = trainingSet.Labels;

% Train multiclass SVM classifier using a fast linear solver, and set
% 'ObservationsIn' to 'columns' to match the arrangement used for training
% features.
classifier = fitcecoc(trainingFeatures, trainingLabels, ...
    'Learners', 'Linear', 'Coding', 'onevsall', 'ObservationsIn', 'columns');


% Extract test features using the CNN
testFeatures = activations(convnet, testSet, featureLayer, 'MiniBatchSize',32);

% Pass CNN image features to trained classifier
predictedLabels = predict(classifier, testFeatures);

% Get the known labels
testLabels = testSet.Labels;

% Tabulate the results using a confusion matrix.
confMat = confusionmat(testLabels, predictedLabels);

% Convert confusion matrix into percentage form
confMat = bsxfun(@rdivide,confMat,sum(confMat,2))

%%
% Iterations for different layers of the network

n = size(confMat,1);

featureLayers = {'conv1','conv2','conv3','conv4','conv5','fc6','fc7'};

output = zeros(7*(n^2),50);
for i = 1:50
	tic
	[trainingSet, testSet] = splitEachLabel(imds, 0.3, 'randomize');
	for FL = 1:7
		trainingFeatures = activations(convnet, trainingSet, featureLayers{FL}, 'MiniBatchSize', 32, 'OutputAs', 'columns');
		trainingLabels = trainingSet.Labels;
		classifier = fitcecoc(trainingFeatures, trainingLabels, 'Learners', 'Linear', 'Coding', 'onevsall', 'ObservationsIn', 'columns');
		testFeatures = activations(convnet, testSet, featureLayers{FL}, 'MiniBatchSize',32);
		predictedLabels = predict(classifier, testFeatures);
		testLabels = testSet.Labels;
		confMat = confusionmat(testLabels, predictedLabels);
		confMat = bsxfun(@rdivide,confMat,sum(confMat,2));
		bot = (FL-1)*(n^2) + 1;
		output(bot:(bot+(n^2)-1),i) = confMat(:);
	end
	i
	toc
end



