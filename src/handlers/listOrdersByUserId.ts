import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { internalError, ok, notFound, forbidden} from "../lib/response";
import { getCaller } from "../lib/caller";
import { GetCommand  } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;


export async function listOrdersByUserId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.userId;
        const callerId = getCaller(event).userId as string;

        if(userId !== callerId){
            return forbidden("Solo puedes listar tus propias ordenes.")
        }

        const result = await dynamo.send(
            new QueryCommand({
                TableName: ORDERS_TABLE,
                IndexName: "UserOrdersIndex",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId" : userId},
                // Conseguir mas recientes primero DESC
                ScanIndexForward: false
            })
        )
        return ok({ order: result.Items ?? [] })
    } catch (error) {
        console.error("Error en getOrder: ", error);
        return internalError()
    }
}