import { Sequelize, DataTypes } from "sequelize";
import { user } from "./types.js";

const sequelize = new Sequelize(
	process.env.DB_SCHEMA || "postgres",
	process.env.DB_USER || "postgres",
	process.env.DB_PASSWORD || "",
	{
		host: process.env.DB_HOST || "postgres",
		port: parseInt(process.env.DB_PORT || "5432"),
		dialect: "postgres",
		dialectOptions: {
			ssl: process.env.DB_SSL == "true",
		},
		logging: false,
	}
);

export const Users = sequelize.define("User", {
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	accessToken: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	sub: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	dollar: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	slToken: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	timer: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

export async function createUser(user: user) {
	console.log;
	Users.create({
		userId: user.userId,
		name: user.name,
		accessToken: user.accessToken,
		sub: user.sub,
		dollar: user.dollar,
		slToken: user.slToken,
		timer: user.timer,
	});
}

async function main() {
	try {
		await sequelize.authenticate();
		await Users.sync();
		console.log("Connection has been established successfully.");
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
}

main();