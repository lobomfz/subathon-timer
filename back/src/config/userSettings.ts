export const defaultValues = {
	pushFrequency: 5,
	timeoutTime: 30,
	keepAlivePing: 30,
	sessionTimeout: 300,
	checkForTimeout: 30,
};

export const defaultUser = {
	endTime: 0,
	subTime: 60,
	dollarTime: 15,
	slStatus: false,
	intervals: {},
	tmiAlive: false,
	slAlive: false,
};

export const exampleUser: any = [
	"tmi",
	"pushToDb",
	"name",
	"userId",
	"slToken",
	"slSocket",
	"slStatus",
	"endTime",
	"subTime",
	"dollarTime",
	"isAlive",
	"lastPing",
	"timeoutChecker",
	"tmiAlive",
	"intervals",
	"connectingToSl",
	"connectingToTmi",
];
