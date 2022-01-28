import Joi from "joi";

// keeping this seperate in case we add some validation rules for the string
const inputStringSchema = Joi.string();
const inputStringClassOptionSchema = Joi.array().ordered(inputStringSchema, Joi.object());
const inputFunctionSchema = Joi.alternatives().try(Joi.function(), inputStringSchema);
const inputClassShema = Joi.alternatives().try(Joi.function().class(), inputStringSchema, inputStringClassOptionSchema);

export const monoflowConfigSchema = Joi.object({
    workspaceLoader: inputFunctionSchema,
    logger: inputClassShema,
    plugins: Joi.array().items(inputClassShema)
});