#====================
#====Front Matter====
#====================

library(rethinking)

MCTI <- read.csv("MonkeyCategoryTI.csv")
MCTI_N <- list(N=length(MCTI$Subject[MCTI$Subject==1]), P=4, D=max(MCTI$Distance[MCTI$Subject==1]), max_trial=max(floor(MCTI$Trial[MCTI$Subject==1]/42)+1), trial=floor(MCTI$Trial[MCTI$Subject==1]/42)+1, Plist=MCTI$Phase[MCTI$Subject==1], Dlist=MCTI$Distance[MCTI$Subject==1], response=MCTI$Response[MCTI$Subject==1])
MCTI_O <- list(N=length(MCTI$Subject[MCTI$Subject==2]), P=4, D=max(MCTI$Distance[MCTI$Subject==2]), max_trial=max(floor(MCTI$Trial[MCTI$Subject==2]/42)+1), trial=floor(MCTI$Trial[MCTI$Subject==2]/42)+1, Plist=MCTI$Phase[MCTI$Subject==2], Dlist=MCTI$Distance[MCTI$Subject==2], response=MCTI$Response[MCTI$Subject==2])

#============================
#====Stan Logistic Models====
#============================

monkey_cat_pair_model_string <- "
data{
	int<lower=1> N;                    // Number of observations
	int<lower=1> C;                    // Number of categories
	vector[N] trials;                  // Trial number
	int<lower=0, upper=1> response[N]; // List of trial results
	real b0prior;
}
parameters{
	real b0;                    // Intercept
	real bt;                    // Time Slope
}
model{

	response ~ bernoulli_logit(b0 + bt*trials);

	b0 ~ normal(b0prior,0.5);
	bt ~ normal(0,1);
}
"

monkey_cat_TI_model_string <- "
data{
	int<lower=1> N;                    // Number of observations
	int<lower=1> C;                    // Number of categories
	vector[N] trials;                  // Trial number
	vector[N] targets;                 // List of target IDs
	vector[N] distrac;                 // List of distractor IDs
	int<lower=0, upper=1> response[N]; // List of trial results
	real b0prior;
	real bdprior;
}
transformed data {
	vector[N] D; // Distance
	vector[N] J; // Joint Rank
	vector[N] Dtrials; // Distance/trial interaction

	for ( i in 1:N ) {
		D[i] = distrac[i] - targets[i] - 2.5;
		J[i] = distrac[i] + targets[i];
		Dtrials[i] = D[i]*trials[i];
	}
}
parameters{
	real b0;                    // Intercept
	real bt;                    // Time Slope
	real bd;                    // Distance Slope
	real btd;                   // Time/Distance Interaction
}
model{

	response ~ bernoulli_logit(b0 + bt*trials + bd*D + btd*Dtrials);

	b0 ~ normal(b0prior,0.5);
	bt ~ normal(0,1);
	bd ~ normal(bdprior,0.5);
	btd ~ normal(0,1);
}
"

p_prior <- list(
	list(b0 = 0, bt = 0),
	list(b0 = 0, bt = 0),
	list(b0 = 0, bt = 0),
	list(b0 = 0, bt = 0)
)

t_prior <- list(
	list(b0 = 0, bt = 0, bd = 0, btd = 0),
	list(b0 = 0, bt = 0, bd = 0, btd = 0),
	list(b0 = 0, bt = 0, bd = 0, btd = 0),
	list(b0 = 0, bt = 0, bd = 0, btd = 0)
)

pair_machine <- stan_model(model_code=monkey_cat_pair_model_string)
trns_machine <- stan_model(model_code=monkey_cat_TI_model_string)

output_N <- list(0)
output_N[[80]] <- 0

prior_phase <- 0
prior_trmnl <- 0
for (sess in 1:80) {
	sessdex <- (MCTI_N$Session==sess)
	dat <- list(N=sum(sessdex), C=5, trials=MCTI_N$Trial[sessdex]-1, targets=MCTI_N$TargetRank[sessdex], distrac=MCTI_N$DistractorRank[sessdex], response=MCTI_N$Correct[sessdex], b0prior=0, bdprior=0)
	
	if (sess > 1) {
		if (prior_phase == mean(MCTI_N$Phase[sessdex])) {
			dat$b0prior <- prior_trmnl
		}
		if (exists("bd",qN)) {
			dat$bdprior <- mean(qN$bd)
		}
	}
	
	if (max(MCTI_N$Distance[sessdex]) == 1) {
		output_N[[sess]] <- sampling(pair_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=p_prior)
	} else {
		output_N[[sess]] <- sampling(trns_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=t_prior)
	}
	qN <- extract.samples(output_N[[sess]])
	prior_trmnl <- mean(qO$b0 + qO$bt*dat$N)
	prior_phase <- mean(MCTI_N$Phase[sessdex])
}

output_O <- list(0)
output_O[[60]] <- 0

prior_phase <- 0
prior_trmnl <- 0
for (sess in 1:60) {
	sessdex <- (MCTI_O$Session==sess)
	dat <- list(N=sum(sessdex), C=5, trials=MCTI_O$Trial[sessdex]-1, targets=MCTI_O$TargetRank[sessdex], distrac=MCTI_O$DistractorRank[sessdex], response=MCTI_O$Correct[sessdex], b0prior=0, bdprior=0)
	
	if (sess > 1) {
		if (prior_phase == mean(MCTI_O$Phase[sessdex])) {
			dat$b0prior <- prior_trmnl
		}
		if (exists("bd",qO)) {
			dat$bdprior <- mean(qO$bd)
		}
	}
	
	if (max(MCTI_O$Distance[sessdex]) == 1) {
		output_O[[sess]] <- sampling(pair_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=p_prior)
	} else {
		output_O[[sess]] <- sampling(trns_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=t_prior)
	}
	qO <- extract.samples(output_O[[sess]])
	prior_trmnl <- mean(qO$b0 + qO$bt*dat$N)
	prior_phase <- mean(MCTI_O$Phase[sessdex])
}

target_N <- c(1,4:7,26:31,33:38,42:53,56:61,66:71,74:79)
target_O <- c(1:5,10:15,17:22,25:36,39:44,47:52,55:60)
sess_type <- c(rep(1,8),rep(2,6),rep(1,6),rep(2,6),rep(1,6),rep(2,6),rep(1,6),rep(2,3))

logistic_est <- matrix(0,nrow=1000*47,ncol=20)
for (sess in 1:47) {
	qN <- extract.samples(output_N[[target_N[sess]]])
	qO <- extract.samples(output_O[[target_O[sess]]])
	for (t in 1:1000) {
		dex <- (sess-1)*1000 + t
		if (sess_type[sess]==1) {
			pN <- qN$b0 + qN$bt*(t-1)
			pO <- qO$b0 + qO$bt*(t-1)
			p <- (pN+pO)/2
			logistic_est[dex,1:5] <- quantile(p,c(0.5,0.005,0.995,0.1,0.9))
		} else {
			for (d in 1:4) {
				pN <- qN$b0 + qN$bt*(t-1) + qN$bd*(d-2.5) + qN$btd*(d-2.5)*(t-1)
				pO <- qO$b0 + qO$bt*(t-1) + qO$bd*(d-2.5) + qO$btd*(d-2.5)*(t-1)
				p <- (pN+pO)/2
				logistic_est[dex,1:5+(d-1)*5] <- quantile(p,c(0.5,0.005,0.995,0.1,0.9))
			}
		}
	}	
}

plot(0,0,xlim=c(0,50000),ylim=c(0.45,0.91),type="n")
lines(inv_logit(logistic_est[,1]),type="l")
lines(inv_logit(logistic_est[,6]),type="l",col="red")
lines(inv_logit(logistic_est[,11]),type="l",col="blue")
lines(inv_logit(logistic_est[,16]),type="l",col="green")

plot(inv_logit(logistic_est[,1]),type="l")
lines(inv_logit(logistic_est[,4]),col=col.alpha(1,0.2))
lines(inv_logit(logistic_est[,5]),col=col.alpha(1,0.2))
lines(c(0,50000),c(0.5,0.5),lty=2)

lines(inv_logit(logistic_est[,6]),type="l",col="red")
lines(inv_logit(logistic_est[,9]),col=col.alpha("red",0.2))
lines(inv_logit(logistic_est[,10]),col=col.alpha("red",0.2))
lines(c(0,50000),c(0.5,0.5),lty=2)

plot(inv_logit(logistic_est[,11]),type="l",col="blue")
lines(inv_logit(logistic_est[,14]),col="blue")
lines(inv_logit(logistic_est[,15]),col="blue")
lines(c(0,50000),c(0.5,0.5),lty=2)

lines(inv_logit(logistic_est[,16]),type="l",col="green")
lines(inv_logit(logistic_est[,19]),col="green")
lines(inv_logit(logistic_est[,20]),col="green")
lines(c(0,50000),c(0.5,0.5),lty=2)


param_range <- matrix(0,nrow=47,ncol=40)
for (sess in 1:47) {
	qN <- extract.samples(output_N[[target_N[sess]]])
	qO <- extract.samples(output_O[[target_O[sess]]])
	param_range[sess,1] <- mean((qN$b0+qO$b0)/2)
	param_range[sess,2:5] <- quantile((qN$b0+qO$b0)/2,c(0.005,0.10,0.90,0.995))
	
	param_range[sess,11] <- mean((qN$bt+qO$bt)/2)
	param_range[sess,12:15] <- quantile((qN$bt+qO$bt)/2,c(0.005,0.10,0.90,0.995))
	
	if (sess_type[sess] == 2) {
		
		param_range[sess,21] <- mean((qN$bd+qO$bd)/2)
		param_range[sess,22:25] <- quantile((qN$bd+qO$bd)/2,c(0.005,0.10,0.90,0.995))
		
		param_range[sess,31] <- mean((qN$btd+qO$btd)/2)
		param_range[sess,32:35] <- quantile((qN$btd+qO$btd)/2,c(0.005,0.10,0.90,0.995))
	}
}

#=================================
#====Stan Reaction Time Models====
#=================================

monkey_cat_pair_RT_string <- "
data{
	int<lower=1> N;         // Number of observations
	real<lower=0> react[N]; // List of trial results
	real b0prior;
}
transformed data {
	real log_react[N]; // Log reaction time
	for ( i in 1:N ) {
		log_react[i] = log(react[i]);
	}
}
parameters{
	real b0;             // Intercept
	real<lower=0> sigma; // Residual Error
}
model{
	for (i in 1:N) {
		log_react[i] ~ normal(b0, sigma);
	}
	b0 ~ normal(b0prior,0.5);
	sigma ~ cauchy(0,2);
}
"

monkey_cat_TI_RT_string <- "
data{
	int<lower=1> N;         // Number of observations
	int<lower=1> C;         // Number of categories
	vector[N] targets;      // List of target IDs
	vector[N] distrac;      // List of distractor IDs
	real<lower=0> react[N]; // List of reaction times
	real b0prior;
	real bdprior;
}
transformed data {
	real D[N];         // Distance
	real log_react[N]; // Log reaction time

	for ( i in 1:N ) {
		D[i] = distrac[i] - targets[i] - 2.5;
		log_react[i] = log(react[i]);
	}
}
parameters{
	real b0;             // Intercept
	real bd;             // Distance Slope
	real<lower=0> sigma; // Residual Error
}
model{
	for (i in 1:N) {
		log_react[i] ~ normal(b0 + bd*D[i], sigma);
	}
	b0 ~ normal(b0prior,0.5);
	bd ~ normal(bdprior,0.5);
	sigma ~ cauchy(0,2);
}
"

p_prior <- list(
	list(b0 = 0, bt = 0),
	list(b0 = 0, bt = 0),
	list(b0 = 0, bt = 0),
	list(b0 = 0, bt = 0)
)

t_prior <- list(
	list(b0 = 0, bt = 0, bd = 0, btd = 0),
	list(b0 = 0, bt = 0, bd = 0, btd = 0),
	list(b0 = 0, bt = 0, bd = 0, btd = 0),
	list(b0 = 0, bt = 0, bd = 0, btd = 0)
)

rt_pair_machine <- stan_model(model_code=monkey_cat_pair_RT_string)
rt_trns_machine <- stan_model(model_code=monkey_cat_TI_RT_string)

output_N_RT <- list(0)
output_N_RT[[80]] <- 0

prior_phase <- 0
prior_trmnl <- 0
for (sess in 1:80) {
	sessdex <- (MCTI_N$Session==sess)
	dat <- list(N=sum(sessdex), C=5, trials=MCTI_N$Trial[sessdex]-1, targets=MCTI_N$TargetRank[sessdex], distrac=MCTI_N$DistractorRank[sessdex], react=MCTI_N$ReactionTime[sessdex]+0.01, b0prior=0, bdprior=0)
	
	if (sess > 1) {
		if (prior_phase == mean(MCTI_N$Phase[sessdex])) {
			dat$b0prior <- prior_trmnl
		}
		if (exists("bd",qN)) {
			dat$bdprior <- mean(qN$bd)
		}
	}

	if (max(MCTI_N$Distance[sessdex]) == 1) {
		output_N_RT[[sess]] <- sampling(rt_pair_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=p_prior)
	} else {
		output_N_RT[[sess]] <- sampling(rt_trns_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=t_prior)
	}
	
	qN <- extract.samples(output_N_RT[[sess]])
	prior_trmnl <- mean(qO$b0)
	prior_phase <- mean(MCTI_N$Phase[sessdex])
}

output_O_RT <- list(0)
output_O_RT[[60]] <- 0

prior_phase <- 0
prior_trmnl <- 0
for (sess in 1:60) {
	sessdex <- (MCTI_O$Session==sess)
	dat <- list(N=sum(sessdex), C=5, trials=MCTI_O$Trial[sessdex]-1, targets=MCTI_O$TargetRank[sessdex], distrac=MCTI_O$DistractorRank[sessdex], react=MCTI_O$ReactionTime[sessdex]+0.01, b0prior=0, bdprior=0)
	
	if (sess > 1) {
		if (prior_phase == mean(MCTI_O$Phase[sessdex])) {
			dat$b0prior <- prior_trmnl
		}
		if (exists("bd",qO)) {
			dat$bdprior <- mean(qO$bd)
		}
	}
	
	if (max(MCTI_O$Distance[sessdex]) == 1) {
		output_O_RT[[sess]] <- sampling(rt_pair_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=p_prior)
	} else {
		output_O_RT[[sess]] <- sampling(rt_trns_machine, data=dat, iter=3000, warmup=1000, chains=4, cores=4, init=t_prior)
	}
	qO <- extract.samples(output_O_RT[[sess]])
	prior_trmnl <- mean(qO$b0)
	prior_phase <- mean(MCTI_O$Phase[sessdex])
}

target_N <- c(1,4:7,26:31,33:38,42:53,56:61,66:71,74:79)
target_O <- c(1:5,10:15,17:22,25:36,39:44,47:52,55:60)
sess_type <- c(rep(1,8),rep(2,6),rep(1,6),rep(2,6),rep(1,6),rep(2,6),rep(1,6),rep(2,3))

react_est <- matrix(0,nrow=47,ncol=20)
for (sess in 1:47) {
	qN <- extract.samples(output_N_RT[[target_N[sess]]])
	qO <- extract.samples(output_O_RT[[target_O[sess]]])
	if (sess_type[sess]==1) {
		pN <- qN$b0
		pO <- qO$b0
		p <- (pN+pO)/2
		react_est[sess,1:5] <- quantile(p,c(0.5,0.005,0.995,0.1,0.9))
	} else {
		for (d in 1:4) {
			pN <- qN$b0 + qN$bd*(d-2.5)
			pO <- qO$b0 + qO$bd*(d-2.5)
			p <- (pN+pO)/2
			react_est[sess,1:5+(d-1)*5] <- quantile(p,c(0.5,0.005,0.995,0.1,0.9))
		}
	}	
}

plot(0,0,xlim=c(0,48),ylim=range(react_est[react_est<0]),type="n")
lines((react_est[,1]),type="l")
lines((react_est[,6]),type="l",col="red")
lines((react_est[,11]),type="l",col="blue")
lines((react_est[,16]),type="l",col="green")

plot((react_est[,1]),ylim=range(react_est[react_est<0]),type="l")
lines((react_est[,4]),col=col.alpha(1,0.2))
lines((react_est[,5]),col=col.alpha(1,0.2))
lines(c(0,50000),c(0.5,0.5),lty=2)

lines((react_est[,6]),type="l",col="red")
lines((react_est[,9]),col=col.alpha("red",0.2))
lines((react_est[,10]),col=col.alpha("red",0.2))
lines(c(0,50000),c(0.5,0.5),lty=2)

lines((react_est[,11]),type="l",col="blue")
lines((react_est[,14]),col="blue")
lines((react_est[,15]),col="blue")
lines(c(0,50000),c(0.5,0.5),lty=2)

lines((react_est[,16]),type="l",col="green")
lines((react_est[,19]),col="green")
lines((react_est[,20]),col="green")
lines(c(0,50000),c(0.5,0.5),lty=2)

param_range_rt <- matrix(0,nrow=47,ncol=20)
for (sess in 1:47) {
	qN <- extract.samples(output_N_RT[[target_N[sess]]])
	qO <- extract.samples(output_O_RT[[target_O[sess]]])
	param_range_rt[sess,1] <- mean((qN$b0+qO$b0)/2)
	param_range_rt[sess,2:5] <- quantile((qN$b0+qO$b0)/2,c(0.005,0.10,0.90,0.995))
	if (sess_type[sess] == 2) {
		param_range_rt[sess,11] <- mean((qN$bd+qO$bd)/2)
		param_range_rt[sess,12:15] <- quantile((qN$bd+qO$bd)/2,c(0.005,0.10,0.90,0.995))
	}
}

#=======================================
#====Big Parameter Correlation Table====
#=======================================

#==Newman==
cors <- matrix(0,nrow=8000,ncol=8)
b0p_grid <- matrix(0,nrow=8000,ncol=80)
b0r_grid <- matrix(0,nrow=8000,ncol=80)
bt_grid <- matrix(0,nrow=8000,ncol=80)
bdp_grid <- matrix(0,nrow=8000,ncol=80)
bdr_grid <- matrix(0,nrow=8000,ncol=80)
btd_grid <- matrix(0,nrow=8000,ncol=80)
for (sess in 1:80) {
	qNp <- extract.samples(output_N[[sess]])
	qNr <- extract.samples(output_N_RT[[sess]])
	b0p_grid[,sess] <- qNp$b0
	b0r_grid[,sess] <- qNr$b0
	bt_grid[,sess] <- qNp$bt
	if (length(qNp) > 3) {
		bdp_grid[,sess] <- qNp$bd
		bdr_grid[,sess] <- qNr$bd
		btd_grid[,sess] <- qNp$btd
	}
}
for (i in 1:8000) {
	q <- (bdp_grid[i,] != 0)
	cors[i,1] <- cor(b0p_grid[i,],b0r_grid[i,])
	cors[i,2] <- cor(bdp_grid[i,q],b0r_grid[i,q])
	cors[i,3] <- cor(bt_grid[i,],b0r_grid[i,])
	cors[i,4] <- cor(btd_grid[i,q],b0r_grid[i,q])
	cors[i,5] <- cor(b0p_grid[i,],bdr_grid[i,])
	cors[i,6] <- cor(bdp_grid[i,q],bdr_grid[i,q])
	cors[i,7] <- cor(bt_grid[i,],bdr_grid[i,])
	cors[i,8] <- cor(btd_grid[i,q],bdr_grid[i,q])
}

#==Oberon==
cors <- matrix(0,nrow=8000,ncol=8)
b0p_grid <- matrix(0,nrow=8000,ncol=60)
b0r_grid <- matrix(0,nrow=8000,ncol=60)
bt_grid <- matrix(0,nrow=8000,ncol=60)
bdp_grid <- matrix(0,nrow=8000,ncol=60)
bdr_grid <- matrix(0,nrow=8000,ncol=60)
btd_grid <- matrix(0,nrow=8000,ncol=60)
for (sess in 1:60) {
	qOp <- extract.samples(output_O[[sess]])
	qOr <- extract.samples(output_O_RT[[sess]])
	b0p_grid[,sess] <- qOp$b0
	b0r_grid[,sess] <- qOr$b0
	bt_grid[,sess] <- qOp$bt
	if (length(qOp) > 3) {
		bdp_grid[,sess] <- qOp$bd
		bdr_grid[,sess] <- qOr$bd
		btd_grid[,sess] <- qOp$btd
	}
}
for (i in 1:8000) {
	q <- (bdp_grid[i,] != 0)
	cors[i,1] <- cor(b0p_grid[i,],b0r_grid[i,])
	cors[i,2] <- cor(bdp_grid[i,q],b0r_grid[i,q])
	cors[i,3] <- cor(bt_grid[i,],b0r_grid[i,])
	cors[i,4] <- cor(btd_grid[i,q],b0r_grid[i,q])
	cors[i,5] <- cor(b0p_grid[i,],bdr_grid[i,])
	cors[i,6] <- cor(bdp_grid[i,q],bdr_grid[i,q])
	cors[i,7] <- cor(bt_grid[i,],bdr_grid[i,])
	cors[i,8] <- cor(btd_grid[i,q],bdr_grid[i,q])
}

#===================
#====BD Analysis====
#===================

monkey_cat_BD_model_string <- "
data{
  int<lower=1> N;                    // Number of observations
  vector[N] trials;                  // Trial number
  int<lower=0, upper=1> response[N]; // List of trial results
}
parameters{
  real b0;                    // Intercept
  real bt;                    // Time Slope
}
model{
  response ~ bernoulli_logit(b0 + bt*trials);
  b0 ~ normal(0,2);
  bt ~ normal(0,2);
}
"

BD_machine <- stan_model(model_code=monkey_cat_BD_model_string)

MCTI$JointRank <- MCTI$Target + MCTI$Distractor
MCTI_N_BD <- list(N=length(MCTI$Subject[(MCTI$Subject==1)&(MCTI$Distance==2)&(MCTI$JointRank==6)]), trials=MCTI$Trial[(MCTI$Subject==1)&(MCTI$Distance==2)&(MCTI$JointRank==6)], response=MCTI$Response[(MCTI$Subject==1)&(MCTI$Distance==2)&(MCTI$JointRank==6)])
MCTI_O_BD <- list(N=length(MCTI$Subject[(MCTI$Subject==2)&(MCTI$Distance==2)&(MCTI$JointRank==6)]), trials=MCTI$Trial[(MCTI$Subject==2)&(MCTI$Distance==2)&(MCTI$JointRank==6)], response=MCTI$Response[(MCTI$Subject==2)&(MCTI$Distance==2)&(MCTI$JointRank==6)])

base = MCTI_N_BD$trials[1]
for (i in 1:(MCTI_N_BD$N-1)) {
  if (MCTI_N_BD$trials[i+1]<MCTI_N_BD$trials[i]) {
    MCTI_N_BD$trials[i] = MCTI_N_BD$trials[i]-base
    base = MCTI_N_BD$trials[i+1]
  } else {
    MCTI_N_BD$trials[i] = MCTI_N_BD$trials[i]-base
  }
}
MCTI_N_BD$trials[MCTI_N_BD$N] = MCTI_N_BD$trials[MCTI_N_BD$N]-base

base = MCTI_O_BD$trials[1]
for (i in 1:(MCTI_O_BD$N-1)) {
  if (MCTI_O_BD$trials[i+1]<MCTI_O_BD$trials[i]) {
    MCTI_O_BD$trials[i] = MCTI_O_BD$trials[i]-base
    base = MCTI_O_BD$trials[i+1]
  } else {
    MCTI_O_BD$trials[i] = MCTI_O_BD$trials[i]-base
  }
}
MCTI_O_BD$trials[MCTI_O_BD$N] = MCTI_O_BD$trials[MCTI_O_BD$N]-base

output_N_BD <- sampling(BD_machine, data=MCTI_N_BD, iter=5000, warmup=1000, chains=4, cores=4, init=p_prior)
output_O_BD <- sampling(BD_machine, data=MCTI_O_BD, iter=5000, warmup=1000, chains=4, cores=4, init=p_prior)
q_N_BD <- extract.samples(output_N_BD)
q_O_BD <- extract.samples(output_O_BD)


#=================================
#====Full Analysis Of Transfer====
#=================================

monkey_TI_model_string <- "
data{
  int<lower=1> N;                    // Number of observations
  vector[N] trials;                  // Trial number
  vector[N] targets;                 // List of target IDs
  vector[N] distrac;                 // List of distractor IDs
  int<lower=0, upper=1> response[N]; // List of trial results
}
transformed data {
  vector[N] D; // Distance
  vector[N] J; // Joint Rank
  vector[N] Dtrials; // Distance/trial interaction
  for ( i in 1:N ) {
    D[i] = distrac[i] - targets[i] - 2.5;
    J[i] = distrac[i] + targets[i];
    Dtrials[i] = D[i]*trials[i];
  }
}
parameters{
  real b0;                    // Intercept
  real bt;                    // Time Slope
  real bd;                    // Distance Slope
  real btd;                   // Time/Distance Interaction
}
model{
  response ~ bernoulli_logit(b0 + bt*trials + bd*D + btd*Dtrials);
  b0 ~ normal(0,2);
  bt ~ normal(0,2);
  bd ~ normal(0,2);
  btd ~ normal(0,2);
}
"
full_machine <- stan_model(model_code=monkey_TI_model_string)

sess_N = c(29,10,9,9)
sess_O = c(13,9,9,9)

q = MCTI$Subject==1
q = q&(((MCTI$Phase==1)&(MCTI$Session==sess_N[1]))|((MCTI$Phase==2)&(MCTI$Session==sess_N[2]))|((MCTI$Phase==3)&(MCTI$Session==sess_N[3]))|((MCTI$Phase==4)&(MCTI$Session==sess_N[4])))
length(MCTI$Subject[q])
MCTI_N_Trns <- list(N=length(MCTI$Subject[q]), trials=MCTI$Trial[q], targets=MCTI$Target[q], distrac=MCTI$Distractor[q], response=MCTI$Response[q])

q = MCTI$Subject==2
q = q&(((MCTI$Phase==1)&(MCTI$Session==sess_O[1]))|((MCTI$Phase==2)&(MCTI$Session==sess_O[2]))|((MCTI$Phase==3)&(MCTI$Session==sess_O[3]))|((MCTI$Phase==4)&(MCTI$Session==sess_O[4])))
length(MCTI$Subject[q])
MCTI_O_Trns <- list(N=length(MCTI$Subject[q]), trials=MCTI$Trial[q], targets=MCTI$Target[q], distrac=MCTI$Distractor[q], response=MCTI$Response[q])

base = MCTI_N_Trns$trials[1]
for (i in 1:(MCTI_N_Trns$N-1)) {
  if (MCTI_N_Trns$trials[i+1]<MCTI_N_Trns$trials[i]) {
    MCTI_N_Trns$trials[i] = MCTI_N_Trns$trials[i]-base
    base = MCTI_N_Trns$trials[i+1]
  } else {
    MCTI_N_Trns$trials[i] = MCTI_N_Trns$trials[i]-base
  }
}
MCTI_N_Trns$trials[MCTI_N_Trns$N] = MCTI_N_Trns$trials[MCTI_N_Trns$N]-base

base = MCTI_O_Trns$trials[1]
for (i in 1:(MCTI_O_Trns$N-1)) {
  if (MCTI_O_Trns$trials[i+1]<MCTI_O_Trns$trials[i]) {
    MCTI_O_Trns$trials[i] = MCTI_O_Trns$trials[i]-base
    base = MCTI_O_Trns$trials[i+1]
  } else {
    MCTI_O_Trns$trials[i] = MCTI_O_Trns$trials[i]-base
  }
}
MCTI_O_Trns$trials[MCTI_O_Trns$N] = MCTI_O_Trns$trials[MCTI_O_Trns$N]-base

output_N_FullTrns <- sampling(full_machine, data=MCTI_N_Trns, iter=5000, warmup=1000, chains=4, cores=4, init=p_prior)
output_O_FullTrns <- sampling(full_machine, data=MCTI_O_Trns, iter=5000, warmup=1000, chains=4, cores=4, init=p_prior)
q_N_FullTrns <- extract.samples(output_N_FullTrns)
q_O_FullTrns <- extract.samples(output_O_FullTrns)

#================================
#====Deep Learning Comparison====
#================================

monkey_TI_model_string <- "
data{
  int<lower=1> N;                    // Number of observations
  vector[N] trials;                  // Trial number
  vector[N] targets;                 // List of target IDs
  vector[N] distrac;                 // List of distractor IDs
  int<lower=0, upper=1> response[N]; // List of trial results
}
transformed data {
  vector[N] D; // Distance
  vector[N] Dtrials; // Distance/trial interaction
  for ( i in 1:N ) {
    D[i] = distrac[i] - targets[i] - 2.5;
    Dtrials[i] = D[i]*trials[i];
  }
}
parameters{
  real b0;                    // Intercept
  real bt;                    // Time Slope
  real bd;                    // Distance Slope
  real btd;                   // Time/Distance Interaction
}
model{
  response ~ bernoulli_logit(b0 + bt*trials + bd*D + btd*Dtrials);
  b0 ~ normal(0,2);
  bt ~ normal(0,2);
  bd ~ normal(0,2);
  btd ~ normal(0,2);
}
"
full_machine <- stan_model(model_code=monkey_TI_model_string)

sess_N = c(29,10,9,9)
sess_O = c(13,9,9,9)

q = MCTI$Subject==1
q = q&(((MCTI$Phase==1)&(MCTI$Session>=sess_N[1]))|((MCTI$Phase==2)&(MCTI$Session>=sess_N[2]))|((MCTI$Phase==3)&(MCTI$Session>=sess_N[3]))|((MCTI$Phase==4)&(MCTI$Session>=sess_N[4])))
length(MCTI$Subject[q])
MCTI_N_AllP <- list(N=length(MCTI$Subject[q]), trials=MCTI$Trial[q], targets=MCTI$Target[q], distrac=MCTI$Distractor[q], response=MCTI$Response[q])

q = MCTI$Subject==2
q = q&(((MCTI$Phase==1)&(MCTI$Session>=sess_O[1]))|((MCTI$Phase==2)&(MCTI$Session>=sess_O[2]))|((MCTI$Phase==3)&(MCTI$Session>=sess_O[3]))|((MCTI$Phase==4)&(MCTI$Session>=sess_O[4])))
length(MCTI$Subject[q])
MCTI_O_AllP <- list(N=length(MCTI$Subject[q]), trials=MCTI$Trial[q], targets=MCTI$Target[q], distrac=MCTI$Distractor[q], response=MCTI$Response[q])

base = MCTI_N_AllP$trials[1]
for (i in 1:(MCTI_N_AllP$N-1)) {
  if (MCTI_N_AllP$trials[i+1]<MCTI_N_AllP$trials[i]) {
    MCTI_N_AllP$trials[i] = MCTI_N_AllP$trials[i]-base
    base = MCTI_N_AllP$trials[i+1]
  } else {
    MCTI_N_AllP$trials[i] = MCTI_N_AllP$trials[i]-base
  }
}
MCTI_N_AllP$trials[MCTI_N_AllP$N] = MCTI_N_AllP$trials[MCTI_N_AllP$N]-base

base = MCTI_O_AllP$trials[1]
for (i in 1:(MCTI_O_AllP$N-1)) {
  if (MCTI_O_AllP$trials[i+1]<MCTI_O_AllP$trials[i]) {
    MCTI_O_AllP$trials[i] = MCTI_O_AllP$trials[i]-base
    base = MCTI_O_AllP$trials[i+1]
  } else {
    MCTI_O_AllP$trials[i] = MCTI_O_AllP$trials[i]-base
  }
}
MCTI_O_AllP$trials[MCTI_O_AllP$N] = MCTI_O_AllP$trials[MCTI_O_AllP$N]-base

output_N_AllP <- sampling(full_machine, data=MCTI_N_AllP, iter=5000, warmup=1000, chains=4, cores=4, init=p_prior)
output_O_AllP <- sampling(full_machine, data=MCTI_O_AllP, iter=5000, warmup=1000, chains=4, cores=4, init=p_prior)
q_N_AllP <- extract.samples(output_N_AllP)
q_O_AllP <- extract.samples(output_O_AllP)
