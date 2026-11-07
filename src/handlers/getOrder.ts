import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { internalError, ok, notFound, forbidden} from "../lib/response";
import { getCaller } from "../lib/caller";
import { GetCommand  } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;


export async function getOrder(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const orderId = event.pathParameters?.id;

        if(!orderId){
            return notFound("La orden no se pudo encontrar.")
        }

        const callerId = getCaller(event).userId as string;

        const result = await dynamo.send(
            new GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } })
        )

        if(!result.Item){
            return notFound("La orden no se pudo encontrar.")
        }

        // Validacion para que solo el dueño pueda ver la orden

        if(result.Item.userId !== callerId){
            return forbidden("Solo puedes ver las ordenes que hayas generado tu.")
        }


        return ok({ order: result.Item })
    } catch (error) {
        console.error("Error en getOrder: ", error);
        return internalError()
    }
}